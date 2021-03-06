import 'cross-fetch/polyfill'
import prisma from '../src/prisma'
import seedDatabase, { userOne, postOne, postTwo } from './utils/seedDatabase'
import getClient from './utils/getClient'
import { getPosts, myPosts, updatePost, createPost, deletePost, subscribeToPosts } from './utils/operations'

const client = getClient()

jest.setTimeout(30000)
beforeEach(seedDatabase)

test('Check exposed published post', async () => {
    const response = await client.query({ query: getPosts })
    expect(response.data.posts.length).toBe(1)
    expect(response.data.posts[0].published).toBe(true)
})

test('Check fetch user posts', async () => {
    const client = getClient(userOne.jwt)
    const { data } = await client.query({ query: myPosts })
    expect(data.myPosts.length).toBe(2)
})

test('Check update owned post', async () => {
    const client = getClient(userOne.jwt)
    const variables = {
        id: postOne.post.id,
        data: {
            published: false
        }
    }
    const { data } = await client.mutate({ mutation: updatePost, variables })
    const exists = await prisma.exists.Post({ id: postOne.post.id, published: false })
    expect(data.updatePost.published).toBe(false)
    expect(exists).toBe(true)
})

test('Check create post', async () => {
    const client = getClient(userOne.jwt)
    const variables = {
       data: {
            title: 'A Fake Post!',
            body: 'This is a fake post',
            published: true
       }
    }
    const { data } = await client.mutate({ mutation: createPost, variables })
    expect(data.createPost.title).toBe('A Fake Post!')
    expect(data.createPost.body).toBe('This is a fake post')
    expect(data.createPost.published).toBe(true)
})

test('Check delete post', async () => {
    const client = getClient(userOne.jwt)
    const variables = {
        id: postTwo.post.id
    }
    await client.mutate({ mutation: deletePost, variables })
    const exists = await prisma.exists.Post({ id: postTwo.post.id })
    expect(exists).toBe(false)
})

test('Check subscribe to published post', async (done) => {
    client.subscribe({ query: subscribeToPosts }).subscribe({
        next(response){
            expect(response.data.post.mutation).toBe('DELETED')
            done()
        }
    })

    await prisma.mutation.deletePost({ where: { id: postOne.post.id } })
})

// Check should not be able to update another users post
// Check should not be able to delete another users post
// Check should require authentication to create a post (could add for update and delete too)
// Check should fetch published post by id 
// Check should fetch own post by id
// Check should not fetch draft post from other user