import AuditLog from "../models/AuditLog.models.js";

/**
 * Middleware to automatically log actions
 * Attach this AFTER authentication middleware
 */
export const auditLogger = (action, category, severity = 'LOW') => {
    return async (req, res, next) => {
        const startTime = Date.now();
        const originalSend = res.send;

        // Capture response
        res.send = function(data) {
            res.send = originalSend;
            
            // Log after response is sent
            const duration = Date.now() - startTime;
            
            // Extract actor information
            const actor = req.admin || req.staff || req.user;
            if (actor) {
                createAuditLog({
                    actor: actor._id,
                    actorModel: req.admin ? 'Admin' : req.staff ? 'Staff' : 'User',
                    actorName: actor.name,
                    actorEmail: actor.email,
                    actorRole: actor.role,
                    action,
                    category,
                    severity,
                    status: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE',
                    description: getDescription(action, req, res),
                    targetModel: req.targetModel,
                    targetId: req.targetId,
                    targetName: req.targetName,
                    changes: req.auditChanges,
                    metadata: {
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('user-agent'),
                        endpoint: req.originalUrl,
                        method: req.method,
                        statusCode: res.statusCode,
                        duration
                    }
                }).catch(err => {
                    console.error('Audit logging error:', err);
                });
            }

            return res.send(data);
        };

        next();
    };
};

/**
 * Manual audit logging function
 * Use this for explicit logging
 */
export const logAudit = async (data) => {
    try {
        await AuditLog.createLog(data);
    } catch (error) {
        console.error('Manual audit logging error:', error);
    }
};

/**
 * Helper to create audit log entry
 */
const createAuditLog = async (data) => {
    try {
        await AuditLog.createLog(data);
    } catch (error) {
        console.error('Error creating audit log:', error);
    }
};

/**
 * Generate human-readable description
 */
const getDescription = (action, req, res) => {
    const actor = req.admin || req.staff || req.user;
    const actorName = actor?.name || 'Unknown';
    
    const descriptions = {
        // Authentication
        'LOGIN': `${actorName} logged in successfully`,
        'LOGOUT': `${actorName} logged out`,
        'LOGIN_FAILED': `Failed login attempt for ${req.body?.email}`,
        
        // User Management
        'USER_CREATED': `${actorName} created new user: ${req.targetName}`,
        'USER_UPDATED': `${actorName} updated user: ${req.targetName}`,
        'USER_DELETED': `${actorName} deleted user: ${req.targetName}`,
        'USER_ACTIVATED': `${actorName} activated user: ${req.targetName}`,
        'USER_DEACTIVATED': `${actorName} deactivated user: ${req.targetName}`,
        
        // Staff Management
        'STAFF_CREATED': `${actorName} created new staff member: ${req.targetName}`,
        'STAFF_UPDATED': `${actorName} updated staff member: ${req.targetName}`,
        'STAFF_DELETED': `${actorName} deleted staff member: ${req.targetName}`,
        'STAFF_ASSIGNED': `${actorName} assigned staff to issue`,
        
        // Issue Management
        'ISSUE_CREATED': `${actorName} created new issue: ${req.targetName}`,
        'ISSUE_UPDATED': `${actorName} updated issue: ${req.targetName}`,
        'ISSUE_ASSIGNED': `${actorName} assigned issue to staff`,
        'ISSUE_STATUS_CHANGED': `${actorName} changed issue status`,
        'ISSUE_PRIORITY_CHANGED': `${actorName} changed issue priority`,
        'ISSUE_RESOLVED': `${actorName} resolved issue: ${req.targetName}`,
        
        // System
        'SETTINGS_UPDATED': `${actorName} updated system settings`,
        'DATA_EXPORTED': `${actorName} exported data`,
        'ANALYTICS_VIEWED': `${actorName} viewed analytics dashboard`,
    };

    return descriptions[action] || `${actorName} performed action: ${action}`;
};

/**
 * Track changes for audit
 * Call this before updating/deleting records
 */
export const trackChanges = (oldData, newData) => {
    return {
        before: oldData,
        after: newData
    };
};

/**
 * Middleware to set target information
 */
export const setAuditTarget = (model, getId, getName) => {
    return (req, res, next) => {
        try {
            req.targetModel = model;
            req.targetId = typeof getId === 'function' ? getId(req) : req.params[getId] || req.body[getId];
            req.targetName = typeof getName === 'function' ? getName(req) : req.body[getName] || 'Unknown';
        } catch (error) {
            console.error('Error setting audit target:', error);
        }
        next();
    };
};

/**
 * Batch audit logging for bulk operations
 */
export const logBulkAudit = async (actions) => {
    try {
        const logs = actions.map(action => ({
            ...action,
            timestamp: new Date()
        }));
        await AuditLog.insertMany(logs);
    } catch (error) {
        console.error('Bulk audit logging error:', error);
    }
};

/**
 * Cleanup old audit logs (for maintenance)
 */
export const cleanupOldLogs = async (daysToKeep = 90) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        const result = await AuditLog.updateMany(
            { timestamp: { $lt: cutoffDate }, isDeleted: false },
            { isDeleted: true }
        );
        
        console.log(`Cleaned up ${result.modifiedCount} old audit logs`);
        return result;
    } catch (error) {
        console.error('Error cleaning up audit logs:', error);
        throw error;
    }
};

export default {
    auditLogger,
    logAudit,
    trackChanges,
    setAuditTarget,
    logBulkAudit,
    cleanupOldLogs
};