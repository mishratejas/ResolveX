export const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
    }
};

export const isStaff = (req, res, next) => {
    if (req.user && (req.user.isStaff || req.user.isAdmin)) {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied. Staff privileges required." });
    }
};

export const isUser = (req, res, next) => {
    if (req.user && !req.user.isStaff && !req.user.isAdmin) {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied. User access only." });
    }
};