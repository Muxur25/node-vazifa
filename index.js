const http = require('http')
const fs = require('fs')
const url = require('url')

// faylni oqish uchun funksiya
function readBooks(callback) {
	fs.readFile('books.json', 'utf8', (err, data) => {
		if (err) {
			callback(err, null)
		} else {
			callback(null, JSON.parse(data))
		}
	})
}

// Faylga yozish uchun funksiya
function writeBooks(data, callback) {
	fs.writeFile('books.json', JSON.stringify(data, null, 2), 'utf8', err => {
		callback(err)
	})
}

const server = http.createServer((req, res) => {
	const parsedUrl = url.parse(req.url, true)
	const method = req.method
	const path = parsedUrl.pathname

	if (path === '/books' && method === 'GET') {
		// GET - /books
		readBooks((err, books) => {
			if (err) {
				res.writeHead(500, { 'Content-Type': 'application/json' })
				res.end(
					JSON.stringify({
						error: "Kitoblar ro'yxatini olishda xatolik yuz berdi",
					})
				)
			} else {
				res.writeHead(200, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify(books))
			}
		})
	} else if (path.match(/^\/books\/\d+$/) && method === 'GET') {
		// GET - /books/:id
		const id = parseInt(path.split('/')[2])
		readBooks((err, books) => {
			if (err) {
				res.writeHead(500, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify({ error: 'Xatolik yuz berdi' }))
			} else {
				const book = books.find(b => b.id === id)
				if (book) {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					res.end(JSON.stringify(book))
				} else {
					res.writeHead(404, { 'Content-Type': 'application/json' })
					res.end(JSON.stringify({ error: 'Kitob topilmadi' }))
				}
			}
		})
	} else if (path === '/books' && method === 'POST') {
		// POST - /books
		let body = ''
		req.on('data', chunk => {
			body += chunk.toString()
		})
		req.on('end', () => {
			const newBook = JSON.parse(body)
			if (!newBook.title || !newBook.author) {
				res.writeHead(400, { 'Content-Type': 'application/json' })
				res.end(
					JSON.stringify({
						error: "Title va author maydonlari to'ldirilishi kerak",
					})
				)
				return
			}

			readBooks((err, books) => {
				if (err) {
					res.writeHead(500, { 'Content-Type': 'application/json' })
					res.end(JSON.stringify({ error: 'Xatolik yuz berdi' }))
				} else {
					const exists = books.some(b => b.title === newBook.title)
					if (exists) {
						res.writeHead(400, { 'Content-Type': 'application/json' })
						res.end(JSON.stringify({ error: 'Bu kitob bazada mavjud' }))
					} else {
						newBook.id = books.length ? books[books.length - 1].id + 1 : 1
						books.push(newBook)
						writeBooks(books, err => {
							if (err) {
								res.writeHead(500, { 'Content-Type': 'application/json' })
								res.end(JSON.stringify({ error: 'Xatolik yuz berdi' }))
							} else {
								res.writeHead(201, { 'Content-Type': 'application/json' })
								res.end(JSON.stringify(newBook))
							}
						})
					}
				}
			})
		})
	} else if (path.match(/^\/books\/\d+$/) && method === 'PUT') {
		// PUT - /books/:id
		const id = parseInt(path.split('/')[2])
		let body = ''
		req.on('data', chunk => {
			body += chunk.toString()
		})
		req.on('end', () => {
			const updatedBook = JSON.parse(body)
			readBooks((err, books) => {
				if (err) {
					res.writeHead(500, { 'Content-Type': 'application/json' })
					res.end(JSON.stringify({ error: 'Xatolik yuz berdi' }))
				} else {
					const index = books.findIndex(b => b.id === id)
					if (index !== -1) {
						books[index] = { id, ...updatedBook }
						writeBooks(books, err => {
							if (err) {
								res.writeHead(500, { 'Content-Type': 'application/json' })
								res.end(JSON.stringify({ error: 'Xatolik yuz berdi' }))
							} else {
								res.writeHead(200, { 'Content-Type': 'application/json' })
								res.end(JSON.stringify(books[index]))
							}
						})
					} else {
						res.writeHead(404, { 'Content-Type': 'application/json' })
						res.end(JSON.stringify({ error: 'Kitob topilmadi' }))
					}
				}
			})
		})
	} else if (path.match(/^\/books\/\d+$/) && method === 'DELETE') {
		// DELETE - /books/:id
		const id = parseInt(path.split('/')[2])
		readBooks((err, books) => {
			if (err) {
				res.writeHead(500, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify({ error: 'Xatolik yuz berdi' }))
			} else {
				const index = books.findIndex(b => b.id === id)
				if (index !== -1) {
					books.splice(index, 1)
					writeBooks(books, err => {
						if (err) {
							res.writeHead(500, { 'Content-Type': 'application/json' })
							res.end(JSON.stringify({ error: 'Xatolik yuz berdi' }))
						} else {
							res.writeHead(200, { 'Content-Type': 'application/json' })
							res.end(JSON.stringify({ message: "Kitob o'chirildi" }))
						}
					})
				} else {
					res.writeHead(404, { 'Content-Type': 'application/json' })
					res.end(JSON.stringify({ error: 'Kitob topilmadi' }))
				}
			}
		})
	} else {
		res.writeHead(404, { 'Content-Type': 'application/json' })
		res.end(JSON.stringify({ error: 'Sahifa topilmadi' }))
	}
})

// Serverni ishga tushirish
server.listen(5000, () => {
	console.log('Server http://localhost:5000 manzilida ishga tushdi')
})
