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

async function withConnection(callback) {
    const connection = await dbUtils.pool.getConnection();
    try {
        return await callback(connection);
    } finally {
        await connection.release();
    }
}

exports.getPoamAssignees = async function getPoamAssignees() {
    return await withConnection(async (connection) => {
        let sql = `
            SELECT t1.userId, t2.fullName, t1.poamId, t3.status
            FROM cpat.poamassignees t1
            INNER JOIN cpat.user t2 ON t1.userId = t2.userId
            INNER JOIN cpat.poam t3 ON t1.poamId = t3.poamId
            ORDER BY t2.fullName
        `;
        let [rowPoamAssignees] = await connection.query(sql);
        const poamAssignees = rowPoamAssignees.map(row => ({
            userId: row.userId,
            fullName: row.fullName,
            poamId: row.poamId,
            status: row.status,
        }));
        return { poamAssignees };
    });
};

exports.getPoamAssigneesByPoamId = async function getPoamAssigneesByPoamId(poamId) {
    if (!poamId) {
        throw new Error('getPoamAssigneesByPoamId: poamId is required');
    }

    return await withConnection(async (connection) => {
        let sql = `
            SELECT t1.userId, t2.firstName, t2.lastName, t2.fullName, t2.email, t1.poamId, t3.status
            FROM cpat.poamassignees t1
            INNER JOIN cpat.user t2 ON t1.userId = t2.userId
            INNER JOIN cpat.poam t3 ON t1.poamId = t3.poamId
            WHERE t1.poamId = ?
            ORDER BY t2.fullName
        `;
        let [rowPoamAssignees] = await connection.query(sql, [poamId]);
        const poamAssignees = rowPoamAssignees.map(row => ({
            userId: row.userId,
            fullName: row.fullName,
            poamId: row.poamId,
            poamStatus: row.status,
        }));
        return poamAssignees;
    });
};


exports.postPoamAssignee = async function postPoamAssignee(req, res, next) {
    if (!req.body.userId) {
        throw new Error('postPoamAssignee: userId is required');
    }

    if (!req.body.poamId) {
        throw new Error('postPoamAssignee: poamId is required');
    }

    return await withConnection(async (connection) => {
        try {
            let fetchSql = "SELECT poamId, userId FROM cpat.poamassignees WHERE userId = ? AND poamId = ?";
            const [existingAssignee] = await connection.query(fetchSql, [req.body.userId, req.body.poamId]);

            if (existingAssignee.length > 0) {
                return existingAssignee[0];
            }

            let addSql = "INSERT INTO cpat.poamassignees (poamId, userId) VALUES (?, ?)";
            await connection.query(addSql, [req.body.poamId, req.body.userId]);

            let userSql = "SELECT fullName FROM cpat.user WHERE userId = ?";
            const [user] = await connection.query(userSql, [req.body.userId]);
            const fullName = user[0] ? user[0].fullName : "Unknown User";

                let action = `${fullName} was added to the Assignee List.`;
                let logSql = "INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
                await connection.query(logSql, [req.body.poamId, action, req.userObject.userId]);

            const notification = {
                title: 'Added as POAM Assignee',
                message: `You have been added as an Assignee for POAM ${req.body.poamId}.`,
                userId: req.body.userId
            };
            const notificationSql = `INSERT INTO cpat.notification (userId, title, message) VALUES (?, ?, ?)`;
            await connection.query(notificationSql, [req.body.userId, notification.title, notification.message]);

            let fetchNewSql = "SELECT poamId, userId FROM cpat.poamassignees WHERE userId = ? AND poamId = ?";
            const [newAssignee] = await connection.query(fetchNewSql, [req.body.userId, req.body.poamId]);

            if (newAssignee.length > 0) {
                return newAssignee[0];
            } else {
                throw new Error('Assignee not found after insertion');
            }
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return await withConnection(async (connection) => {
                    let fetchSql = "SELECT poamId, userId FROM cpat.poamassignees WHERE userId = ? AND poamId = ?";
                    const [existingAssignee] = await connection.query(fetchSql, [req.body.userId, req.body.poamId]);
                    return existingAssignee[0];
                });
            }
            else {
                return { error: error.message };
            }
        }
    });
};

exports.deletePoamAssignee = async function deletePoamAssignee(req, res, next) {
    if (!req.params.userId) {
        throw new Error('deletePoamAssignee: userId is required');
    }
    if (!req.params.poamId) {
        throw new Error('deletePoamAssignee: poamId is required');
    }

    await withConnection(async (connection) => {
        const userSql = "SELECT fullName FROM cpat.user WHERE userId = ?";
        const [user] = await connection.query(userSql, [req.params.userId]);
        const fullName = user[0] ? user[0].fullName : "Unknown User";

        let sql = "DELETE FROM cpat.poamassignees WHERE userId = ? AND poamId = ?";
        await connection.query(sql, [req.params.userId, req.params.poamId]);

            let action = `${fullName} was removed from the Assignee List.`;
            let logSql = `INSERT INTO cpat.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [req.params.poamId, action, req.userObject.userId]);

        const notification = {
            title: 'Removed from POAM Assignee list',
            message: `You have been removed from the Assignee list for POAM ${req.params.poamId}.`,
            userId: req.params.userId
        };
        const notificationSql = `INSERT INTO cpat.notification (userId, title, message) VALUES (?, ?, ?)`;
        await connection.query(notificationSql, [req.params.userId, notification.title, notification.message]);
    });
};