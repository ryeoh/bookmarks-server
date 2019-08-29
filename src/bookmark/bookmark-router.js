const express = require('express');
// const uuid = require('uuid/v4');
const { isWebUri }= require('valid-url');
const xss = require('xss');
const logger = require('../logger');
// const { bookmarks } = require('../store');
const BookmarkService = require('./bookmark-service');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: bookmark.url,
    description: xss(bookmark.description),
    rating: Number(bookmark.rating)
})

bookmarkRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        BookmarkService.getAllBookmarks(req.app.get('db'))
            .then(bookmarks => {
                res.json(bookmarks.map(serializeBookmark));
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { title, url, description, rating } = req.body;

        if (!title) {
            logger.error(`A title is required`);
            return res
                .status(400)
                .send('Invalid data');
        }

        if (!url) {
            logger.error(`The URL is required`);
            return res
                .status(400)
                .send('Invalid data');
        }

        if (!rating) {
            logger.error(`A rating is required`);
            return res
                .status(400)
                .send('Invalid data');
        }

        if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
            logger.error(`Invalid rating ${rating}.`);
            return res
                .status(400)
                .send({
                    error: { message: 'Rating must be an integer between 0 and 5.'}
                })
        }

        if (!isWebUri(url)) {
            logger.error(`Invalid url ${url}`);
            return res
                .status(400)
                .send({
                    error: {message: 'URL must be valid.'}
                })
        }

    const newBookmark = { title, url, description, rating };

    BookmarkService.insertBookmark(
        req.app.get('db'),
        newBookmark
    )
        .then(bookmark => {
            logger.info(`Bookmark ${JSON.stringify(bookmark)} with id ${id} created.`)
            res
                .status(201)
                .location(`/bookmarks/${bookmark.id}`)
                .json(serializeBookmark(bookmark))
        })
        .catch(next)
    });

bookmarkRouter
    .route('/bookmarks/:id')
    .all((req, res, next) => {
        const { id } = req.params;
        BookmarkService.getById(req.app.get('db'), id)
            .then(bookmark => {
                if (!bookmark) {
                    logger.error(`Bookmark with id ${id} not found.`)
                    return res.status(404)
                        .json({
                            error: {message: `Bookmark Not Found`}
                        })
                }
                res.bookmark = bookmark;
                next();
            })
            .catch(next)
    })
    .get((req, res) => {
        res.json(serializeBookmark(res.bookmark))
    })
    .delete((req, res, next) => {
        const { id } = req.params;
        BookmarkService.deleteBookmark(
            req.app.get('db'), 
            id
        )
            .then(numRowsAffected => {
                logger.info(`Bookmark with id ${id} deleted.`)
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = bookmarkRouter;