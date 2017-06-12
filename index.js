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
	title: String,
	content: String
}, { collection: 'posts' }))

const Comment = mongoose.model('Comment', mongoose.Schema({
	post: mongoose.Schema.ObjectId,
	content: String
}, { collection: 'comments' }))


async function start() {
	try {
		await mongoose.connect(MONGO_URL)

		const typeDefs = [`
      type Query {
        post(_id: String): Post
        posts: [Post]
        comment(_id: String): Comment
      }
      type Post {
        _id: String
        title: String
        content: String
        comments: [Comment]
      }
      type Comment {
        _id: String
        content: String
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
				post: (parent, args, context, info) => {
					const selectFields = info.fieldNodes[0].selectionSet.selections.map(f => f.name.value).join(' ');
					return Post.findById(args._id).select(selectFields).lean().exec()
				},
				posts: (parent, args, context, info) => {
					const selectFields = info.fieldNodes[0].selectionSet.selections.map(f => f.name.value).join(' ');
					return Post.find(args).select(selectFields).lean().exec()
				},
				comment: (parent, args, context, info) => {
					const selectFields = info.fieldNodes[0].selectionSet.selections.map(f => f.name.value).join(' ');
					return Comment.findById(args._id).select(selectFields).lean().exec()
				},
			},

			// Indirect queries
			Post: {
				comments: async (parent, args, context, info) => {
					const selectFields = info.fieldNodes[0].selectionSet.selections.map(f => f.name.value).join(' ');
					return Comment.find({ post: parent._id }).select(selectFields).lean().exec();
				}
			},
			Comment: {
				post: async (parent, args, context, info) => {
					const selectFields = info.fieldNodes[0].selectionSet.selections.map(f => f.name.value).join(' ');
					return Post.findById(parent.post).select(selectFields).lean().exec();
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

		const schema = makeExecutableSchema({
			typeDefs,
			resolvers
		})


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

start();
