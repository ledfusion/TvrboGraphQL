Tvrbo GraphQL
---

This is an example setup of an API server using **GraphQL** on a **MongoDB** server with **Mongoose**.

## Setup

	npm install
	node .

Open [http://localhost:8080/graphiql](http://localhost:8080/graphiql) on your browser and copy the following sample queries:

	query listPosts {
		posts {
			_id
			title
			content
			comments {
				_id
				content
			} 
		}
	}
	query getPost {
		post(_id: "593da891a2ac8d808201566d") {  # replace it with an existing ID
			_id
			title
			content
		}
	}
	query getComment {
		comment(_id: "593de5842a5a0184e1f3f4f5") {  # replace it with an existing ID
			_id
			content
			post {
				_id
				title
				content
			}
		}
	}
	mutation createPost {
		createPost(title:"Hey", content:"you") {
			_id
			title
			content
		}
	}
	mutation createComment {
		createComment(post:"593da891a2ac8d808201566d", content:"This is a comment") {  # replace the post id with an existing ID
			_id
			post {
				_id
				title
				content
			}
			content
		}
	}

Run MongoDB on your computer, create some posts/comments and replace the _id values above by the real id's once they exist.


## Cheatsheet
* [GraphQL Cheatsheet](https://raw.githubusercontent.com/sogko/graphql-shorthand-notation-cheat-sheet/master/graphql-shorthand-notation-cheat-sheet.png)
* [GraphQL Tools documentation](http://dev.apollodata.com/tools/graphql-tools/resolvers.html)
