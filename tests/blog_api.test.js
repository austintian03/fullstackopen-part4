const { test, beforeEach, after, describe } = require('node:test')
const assert = require('node:assert')
const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
    await Blog.deleteMany({})

    for (let blog of helper.initialBlogs) {
        let blogObject = new Blog(blog)
        await blogObject.save()
    }
})

test('all blog posts are returned as json', async () => {
    const blogPosts = await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    
    assert.strictEqual(blogPosts.body.length, helper.initialBlogs.length)
})

test('unique identifier property of the blog posts is named "id"', async () => {
    const blogs = await helper.blogsInDb()

    const blogToView = blogs[0]

    assert(!blogToView.hasOwnProperty('_id') && blogToView.hasOwnProperty('id'))
})

test('a valid blog post can be added', async () => {
    const newBlog = {
        title: "TDD harms architecture",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
        likes: 0,
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

    const urls = blogsAtEnd.map(b => b.url)
    assert(urls.includes('http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html'))
})

test('creating a blog post without a "likes" property defaults to 0', async () => {
    const newBlog = {
        title: "TDD harms architecture",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
    }

    const savedNote = await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    assert.strictEqual(savedNote.body.likes, 0)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)
})  

test('cannot create a blog post that is missing a title', async () => {
    const noTitle = {
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
        likes: 20
    }

    await api
        .post('/api/blogs')
        .send(noTitle)
        .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
})

test('cannot create a blog post that is missing an url', async () => {
    const noTitle = {
        title: "TDD harms architecture",
        author: "Robert C. Martin",
        likes: 20
    }

    await api
        .post('/api/blogs')
        .send(noTitle)
        .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
})

describe('deletion of a blog', () => {
    test('succeeds with status code 204 if id is valid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()
        assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)

        const ids = blogsAtEnd.map(b => b.id)
        assert(!ids.includes(blogToDelete.id))
    })

    test('fails with status code 404 if blog does not exist', async () => {
        const validNonexistingId = await helper.nonExistingId()

        await api
            .delete(`/api/blogs/${validNonexistingId}`)
            .expect(404)

        const blogsAtEnd = await helper.blogsInDb()
        assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })
})

describe('updating a blog', () => {
    test('updating the number of likes for an existing blog post succeeds', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToUpdate = blogsAtStart[0]

        const updatedBlog = await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send({ likes: blogToUpdate.likes + 5 })
            .expect(200)
        
        assert.strictEqual(updatedBlog.body.likes, blogToUpdate.likes + 5)
    })

    test('fails with status code 404 if blog does not exist', async () => {
        const validNonexistingId = await helper.nonExistingId()

        await api
            .put(`/api/blogs/${validNonexistingId}`)
            .send({ likes: 5 })
            .expect(404)
    })

    test('fails with status code 400 if number of likes is set to a non-number', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToUpdate = blogsAtStart[0]

        await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send({ likes: 'fifty' })
            .expect(400)
    })
})

after(async () => {
    await mongoose.connection.close()
})