const { test, beforeEach, after } = require('node:test')
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

after(async () => {
    await mongoose.connection.close()
})