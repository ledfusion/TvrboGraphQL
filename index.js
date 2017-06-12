const express = require('express');
const mongoose = require('mongoose');
global.Promise = require('bluebird');
mongoose.Promise = global.Promise;

const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');
// const cors = require('cors');

const URL = 'http://localhost'
const PORT = 8080
const MONGO_URL = 'mongodb://localhost:27017/test'

// DB MODEL

const Post = mongoose.model('Post', mongoose.Schema({
	title: { type: String, required: true },
	content: String,
	date: { type: Date, default: Date.now }
}, { collection: 'posts' }))

const Comment = mongoose.model('Comment', mongoose.Schema({
	post: { type: mongoose.Schema.ObjectId, required: true },
	content: { type: String, required: true },
	date: { type: Date, default: Date.now }
}, { collection: 'comments' }))

// SERVER START

function dbConnect() {
	return mongoose.connect(MONGO_URL)
}

function graphqlSetup() {

	const typeDefs = [`
      type Query {
        posts(skip: Int = 0, limit: Int = 30, sortBy: String = "date", sortAscending: Boolean = true): [Post]
        post(_id: String): Post
        comment(_id: String): Comment
      }
      type Post {
        _id: String
        title: String
        content: String
				date: String
        comments: [Comment]
      }
      type Comment {
        _id: String
        content: String
				date: String
        post: Post
      }
      type Mutation {
        createPost(title: String, content: String): Post
        createComment(post: String, content: String): Comment
      }

      schema {
        query: Query
        mutation: Mutation
      }
    `];

	const resolvers = {
		// Direct queries
		Query: {
			posts: (parent, args, context, info) => {
				const { skip, limit, sortBy, sortAscending } = args;
				delete args.skip;
				delete args.limit;
				delete args.sortBy;
				delete args.sortAscending;

				const selectFields = info.fieldNodes[0].selectionSet.selections.map(f => f.name.value).join(' ');

				return Post.find(args).select(selectFields).skip(skip).limit(limit).sort(sortAscending ? sortBy : `-${sortBy}`).lean().exec()
			},
			post: (parent, args, context, info) => {
				const selectFields = info.fieldNodes[0].selectionSet.selections.map(f => f.name.value).join(' ');

				if (selectFields == "_id") return { _id: args._id };
				else return Post.findById(args._id).select(selectFields).lean().exec()
			},
			comment: (parent, args, context, info) => {
				const selectFields = info.fieldNodes[0].selectionSet.selections.map(f => f.name.value).join(' ');

				if (selectFields == "_id") return { _id: args._id };
				else return Comment.findById(args._id).select(selectFields).lean().exec()
			},
		},

		// Indirect queries
		Post: {
			comments: async (parent, args, context, info) => {
				const selectFields = info.fieldNodes[0].selectionSet.selections.map(f => f.name.value).join(' ');

				if (selectFields == "_id") return { _id: parent.post };
				else return Comment.find({ post: parent._id }).select(selectFields).lean().exec();
			}
		},
		Comment: {
			post: async (parent, args, context, info) => {
				const selectFields = info.fieldNodes[0].selectionSet.selections.map(f => f.name.value).join(' ');

				if (selectFields == "_id") return { _id: parent.post };
				else return Post.findById(parent.post).select(selectFields).lean().exec();
			}
		},

		// Updates
		Mutation: {
			createPost: async (root, args, context, info) => {
				return Post.create(args)
			},
			createComment: async (root, args) => {
				return Comment.create(args)
			},
		},
	}

	return makeExecutableSchema({
		typeDefs,
		resolvers
	})
}

async function serverStart() {
	try {
		await dbConnect()

		const schema = graphqlSetup();

		// SERVER

		const app = express()
		// app.use(cors())

		app.use('/graphql', bodyParser.json(), graphqlExpress(req => ({
			schema,
			context: { req }
		})))

		app.use('/graphiql', graphiqlExpress({
			endpointURL: '/graphql'
		}))

		app.listen(PORT, () => {
			console.log(`Visit ${URL}:${PORT}/graphiql`)
		})

	} catch (e) {
		console.log(e)
	}
}

serverStart();
