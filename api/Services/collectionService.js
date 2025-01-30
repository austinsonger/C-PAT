/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

'use strict';
const config = require('../utils/config');
const dbUtils = require('./utils');
const mysql = require('mysql2');
const logger = require('../utils/logger');
const SmError = require('../utils/error');

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getCollections = async function getCollections(elevate, req) {
    try {
        return await withConnection(async (connection) => {
            if (elevate && req.userObject.isAdmin === true) {
                const user = {
                    collections: []
                }
                    let sql2 = "SELECT * FROM collection;"
                    let [row2] = await connection.query(sql2)
                    const size = Object.keys(row2).length
                    for (let counter = 0; counter < size; counter++) {
                        user.collections.push({
                            ...row2[counter]
                        });
                    }
                    return user.collections;
            } else {
                let collectionSql = `
                SELECT c.*
                FROM collection c
                INNER JOIN collectionpermissions cp ON c.collectionId = cp.collectionId
                WHERE cp.userId = ?;
            `;
                let [collections] = await connection.query(collectionSql, [req.userObject.userId]);
                return collections.map(collection => ({
                    collectionId: collection.collectionId,
                    collectionName: collection.collectionName,
                    description: collection.description,
                    collectionOrigin: collection.collectionOrigin,
                    systemType: collection.systemType,
                    systemName: collection.systemName,
                    ccsafa: collection.ccsafa,
                    aaPackage: collection.aaPackage,
                    created: collection.created,
                }));
            }
        });
    }
    catch (error) {
        return { error: error.message };
    }
}

exports.getCollectionBasicList = async function getCollectionBasicList(req, res, next) {
    try {
        return await withConnection(async (connection) => {
            const sql = "SELECT collectionId, collectionName, collectionOrigin, originCollectionId, systemType, systemName, ccsafa, aaPackage FROM collection";
            const [rows] = await connection.query(sql);
            return rows;
        });
    } catch (error) {
        return { error: error.message };
    }
};

exports.postCollection = async function postCollection(req, res, next) {
    if (!req.body.collectionName) {
        return next({
            status: 400,
            errors: {
                collectionName: 'is required',
            }
        });
    }
    if (!req.body.description) {
        req.body.description = ""
    }
    if (!req.body.collectionOrigin) {
        req.body.collectionOrigin = "C-PAT"
    }
    if (!req.body.originCollectionId) {
        req.body.originCollectionId = null;
    }
    if (!req.body.systemType) {
        req.body.systemType = ""
    }
    if (!req.body.systemName) {
        req.body.systemName = ""
    }
    if (!req.body.ccsafa) {
        req.body.ccsafa = ""
    }
    if (!req.body.aaPackage) {
        req.body.aaPackage = ""
    }

    try {
        return await withConnection(async (connection) => {
            let sql_query = `INSERT INTO cpat.collection (collectionName, description, collectionOrigin, originCollectionId, systemType, systemName, ccsafa, aaPackage) VALUES (?, ?, ?, ?, ?, ?, ?, ?) `
            await connection.query(sql_query, [req.body.collectionName, req.body.description, req.body.collectionOrigin, req.body.originCollectionId, req.body.systemType, req.body.systemName, req.body.ccsafa, req.body.aaPackage])
            let sql = "SELECT * FROM cpat.collection WHERE collectionId = LAST_INSERT_ID();"
            let [rowCollection] = await connection.query(sql)

            const collection = rowCollection[0]
            return (collection)
        });
    } catch (error) {
        return { error: error.message };
    }
}

exports.putCollection = async function putCollection(req, res, next) {
    if (!req.body.collectionId) {
        return next({
            status: 400,
            errors: {
                collectionId: 'is required',
            }
        });
    }
    if (!req.body.collectionName) req.body.collectionName = undefined;
    if (!req.body.description) req.body.description = "";
    if (!req.body.systemType) req.body.systemType = "";
    if (!req.body.systemName) req.body.systemName = "";
    if (!req.body.ccsafa) req.body.ccsafa = "";
    if (!req.body.aaPackage) req.body.aaPackage = "";

    try {
        return await withConnection(async (connection) => {
            let sql_query = "UPDATE cpat.collection SET collectionName = ?, description = ?, systemType = ?, systemName = ?, ccsafa = ?, aaPackage = ? WHERE collectionId = ?";
            await connection.query(sql_query, [
                req.body.collectionName,
                req.body.description,
                req.body.systemType,
                req.body.systemName,
                req.body.ccsafa,
                req.body.aaPackage,
                req.body.collectionId
            ]);

            const message = new Object();
            message.collectionId = req.body.collectionId;
            message.collectionName = req.body.collectionName;
            message.description = req.body.description;
            message.systemType = req.body.systemType;
            message.systemName = req.body.systemName;
            message.ccsafa = req.body.ccsafa;
            message.aaPackage = req.body.aaPackage;
            return message;
        });
    }
    catch (error) {
        return { error: error.message };
    }
}