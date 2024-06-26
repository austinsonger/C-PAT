/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

'use strict';
const config = require('../../utils/config');
const dbUtils = require('./utils');
const mysql = require('mysql2');

async function withConnection(callback) {
    const pool = dbUtils.getPool();
    const connection = await pool.getConnection();
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
            FROM poamtracking.poamassignees t1
            INNER JOIN poamtracking.user t2 ON t1.userId = t2.userId
            INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId
            ORDER BY t2.fullName
        `;
        let [rowPoamAssignees] = await connection.query(sql);
        var poamAssignees = rowPoamAssignees.map(row => ({
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
            SELECT t1.userId, t2.firstName, t2.lastName, t2.fullName, t2.userEmail, t1.poamId, t3.status
            FROM poamtracking.poamassignees t1
            INNER JOIN poamtracking.user t2 ON t1.userId = t2.userId
            INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId
            WHERE t1.poamId = ?
            ORDER BY t2.fullName
        `;
        let [rowPoamAssignees] = await connection.query(sql, [poamId]);
        var poamAssignees = rowPoamAssignees.map(row => ({
            userId: row.userId,
            fullName: row.fullName,
            poamId: row.poamId,
            poamStatus: row.status,
        }));
        return poamAssignees;
    });
};

exports.getPoamAssigneesByUserId = async function getPoamAssigneesByUserId(userId) {
    if (!userId) {
        throw new Error('getPoamAssigneesByUserId: userId is required');
    }

    return await withConnection(async (connection) => {
        let sql = `
            SELECT t1.userId, t2.fullName, t1.poamId, t3.status
            FROM poamtracking.poamassignees t1
            INNER JOIN poamtracking.user t2 ON t1.userId = t2.userId
            INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId
            WHERE t1.userId = ?
            ORDER BY t2.fullName
        `;
        let [rowPoamAssignees] = await connection.query(sql, [userId]);
        var poamAssignees = rowPoamAssignees.map(row => ({
            userId: row.userId,
            fullName: row.fullName,
            poamId: row.poamId,
            poamStatus: row.status,
        }));
        return { poamAssignees };
    });
};

exports.getPoamAssignee = async function getPoamAssignee(userId, poamId) {
    if (!userId) {
        throw new Error('getPoamAssignee: userId is required');
    }
    if (!poamId) {
        throw new Error('getPoamAssignee: poamId is required');
    }

    return await withConnection(async (connection) => {
        let sql = `
            SELECT t1.userId, t2.fullName, t1.poamId, t3.status
            FROM poamtracking.poamassignees t1
            INNER JOIN poamtracking.user t2 ON t1.userId = t2.userId
            INNER JOIN poamtracking.poam t3 ON t1.poamId = t3.poamId
            WHERE t1.userId = ? AND t1.poamId = ?
            ORDER BY t2.fullName
        `;
        let [rowPoamAssignees] = await connection.query(sql, [userId, poamId]);
        var poamAssignees = rowPoamAssignees.map(row => ({
            userId: row.userId,
            fullName: row.fullName,
            poamId: row.poamId,
            poamStatus: row.status,
        }));
        var poamAssignee = poamAssignees.length > 0 ? [poamAssignees[0]] : [];
        return { poamAssignee };
    });
};

exports.postPoamAssignee = async function postPoamAssignee(data) {
    const { userId, poamId, poamLog } = data;

    if (!userId) {
        throw new Error('postPoamAssignee: userId is required');
    }

    if (!poamId) {
        throw new Error('postPoamAssignee: poamId is required');
    }

    return await withConnection(async (connection) => {
        try {
            let fetchSql = "SELECT poamId, userId FROM poamtracking.poamassignees WHERE userId = ? AND poamId = ?";
            const [existingAssignee] = await connection.query(fetchSql, [userId, poamId]);

            if (existingAssignee.length > 0) {
                return existingAssignee[0];
            }

            let addSql = "INSERT INTO poamtracking.poamassignees (poamId, userId) VALUES (?, ?)";
            await connection.query(addSql, [poamId, userId]);

            let userSql = "SELECT fullName FROM poamtracking.user WHERE userId = ?";
            const [user] = await connection.query(userSql, [userId]);
            const fullName = user[0] ? user[0].fullName : "Unknown User";

            if (poamLog && poamLog[0] && poamLog[0].userId) {
                let action = `${fullName} was added to the Assignee List.`;
                let logSql = "INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)";
                await connection.query(logSql, [poamId, action, poamLog[0].userId]);
            }

            let fetchNewSql = "SELECT poamId, userId FROM poamtracking.poamassignees WHERE userId = ? AND poamId = ?";
            const [newAssignee] = await connection.query(fetchNewSql, [userId, poamId]);

            if (newAssignee.length > 0) {
                return newAssignee[0];
            } else {
                throw new Error('Assignee not found after insertion');
            }
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return await withConnection(async (connection) => {
                    let fetchSql = "SELECT poamId, userId FROM poamtracking.poamassignees WHERE userId = ? AND poamId = ?";
                    const [existingAssignee] = await connection.query(fetchSql, [userId, poamId]);
                    return existingAssignee[0];
                });
            }
            else {
                console.error("error: ", error);
                return { null: "null" };
            }
        }
    });
};

exports.deletePoamAssignee = async function deletePoamAssignee(userId, poamId, requestorId) {
    if (!userId) {
        throw new Error('deletePoamAssignee: userId is required');
    }
    if (!poamId) {
        throw new Error('deletePoamAssignee: poamId is required');
    }

    await withConnection(async (connection) => {
        const userSql = "SELECT fullName FROM poamtracking.user WHERE userId = ?";
        const [user] = await connection.query(userSql, [userId]);
        const fullName = user[0] ? user[0].fullName : "Unknown User";

        let sql = "DELETE FROM poamtracking.poamassignees WHERE userId = ? AND poamId = ?";
        await connection.query(sql, [userId, poamId]);

        if (requestorId) {
            let action = `${fullName} was removed from the Assignee List.`;
            let logSql = `INSERT INTO poamtracking.poamlogs (poamId, action, userId) VALUES (?, ?, ?)`;
            await connection.query(logSql, [poamId, action, requestorId]);
        }
    });
};