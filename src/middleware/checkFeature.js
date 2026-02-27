/**
 * checkFeature(featureName) — middleware factory
 * Returns 403 if the user's plan does not include the specified feature.
 * Depends on checkSubscription having run first (req.consultora.limites).
 *
 * Usage: router.post('/...', auth, checkSubscription, checkFeature('tem_pipeline'), handler)
 */
module.exports = function checkFeature(featureName) {
    return (req, res, next) => {
        // Admins always pass
        if (req.consultora.plano === 'admin') return next();

        const limites = req.consultora.limites || {};
        if (!limites[featureName]) {
            return res.status(403).json({
                error: 'Esta funcionalidade não está disponível no seu plano atual.',
                code: 'FEATURE_NOT_AVAILABLE',
                feature: featureName,
            });
        }
        next();
    };
};
