const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  const sumLikes = (total, blog) => total + blog.likes

  return blogs.reduce(sumLikes, 0)
}

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return {}
  }

  const getMostLiked = (a, b) => a.likes >= b.likes ? a : b
  const favorite = blogs.reduce(getMostLiked)
  const { title, author, likes } = favorite

  return { title, author, likes }
  
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
}