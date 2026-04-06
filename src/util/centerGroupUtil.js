/**
 * Center Group Utility
 * 
 * This utility provides centralized management of center groups and related functionality.
 * It allows for easy configuration of center groupings and provides reusable functions
 * for APIs that need to implement center-based filtering and sorting.
 */

const { Op } = require('sequelize');
const { CenterGroup } = require('../../db/models');

/**
 * Cache for center groups to improve performance
 */
let centerGroupsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load center groups from database
 * @returns {Promise<Object>} Center groups object
 */
const loadCenterGroupsFromDB = async () => {
    try {
        const groups = await CenterGroup.findAll({
            where: { is_active: true },
            attributes: ['id', 'group_name', 'center_ids'],
            order: [['created_at', 'ASC']]
        });

        // Convert to the expected format
        const centerGroups = {};
        groups.forEach((group, index) => {
            centerGroups[`group${index + 1}`] = group.center_ids || [];
        });

        return centerGroups;
    } catch (error) {
        console.error('Error loading center groups from database:', error);
        // Fallback to empty object if database fails
        return {};
    }
};

/**
 * Get center groups with caching
 * @returns {Promise<Object>} Center groups object
 */
const getCenterGroupsFromDB = async () => {
    const now = Date.now();
    
    // Check if cache is valid
    if (centerGroupsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        return centerGroupsCache;
    }

    // Load from database and update cache
    centerGroupsCache = await loadCenterGroupsFromDB();
    cacheTimestamp = now;
    
    return centerGroupsCache;
};

/**
 * Clear the center groups cache
 * Call this when center groups are updated
 */
const clearCenterGroupsCache = () => {
    centerGroupsCache = null;
    cacheTimestamp = null;
};

/**
 * Get all center groups configuration
 * @returns {Promise<Object>} Center groups configuration
 */
const getCenterGroups = async () => {
    return await getCenterGroupsFromDB();
};

/**
 * Find which group a center belongs to
 * @param {number|string} centerId - The center ID to check
 * @returns {Promise<Object>} Group information
 */
const findCenterGroup = async (centerId) => {
    try {
        const centerGroups = await getCenterGroupsFromDB();
        const centerIdStr = String(centerId);
        
        for (const [groupName, centerIds] of Object.entries(centerGroups)) {
            if (centerIds.includes(centerIdStr)) {
                return {
                    groupName,
                    centerIds,
                    isInGroup: true
                };
            }
        }
        
        return {
            groupName: null,
            centerIds: [],
            isInGroup: false
        };
    } catch (error) {
        console.error('Error finding center group:', error);
        return {
            groupName: null,
            centerIds: [],
            isInGroup: false
        };
    }
};

/**
 * Resolve target center IDs based on the provided center ID
 * @param {number|null} centerId - The center ID from payload
 * @returns {Promise<Object>} Target center information
 */
const resolveTargetCenters = async (centerId) => {
    if (!centerId) {
       return {
            targetCenterIds: [],
            isGroupSearch: false,
            isAllCentersSearch: true,
            requestedCenter: null,
            groupInfo: null
        };
    }

    const groupInfo = await findCenterGroup(centerId);
    
    if (groupInfo.isInGroup) {
        return {
            targetCenterIds: groupInfo.centerIds,
            isGroupSearch: true,
            isAllCentersSearch: false,
            requestedCenter: centerId,
            groupInfo: groupInfo
        };
    } else {
        return {
            targetCenterIds: [],
            isGroupSearch: false,
            isAllCentersSearch: true,
            requestedCenter: centerId,
            groupInfo: null
        };
    }
};

/**
 * Generate sorting order clause for Sequelize queries
 * @param {Array} targetCenterIds - Array of target center IDs
 * @param {string} centerField - The field name to match against (default: 'createdBy')
 * @param {Array} defaultOrder - Default order clause (default: [['createdAt', 'DESC']])
 * @param {string} tableAlias - The table alias to use for the center field (default: '')
 * @returns {Array} Order clause for Sequelize
 */
const generateSortingOrder = (targetCenterIds, centerField = 'createdBy', defaultOrder = [['createdAt', 'DESC']], tableAlias = '') => {
    if (targetCenterIds.length === 0) {
        return defaultOrder;
    }

    // Create a CASE statement for multiple center IDs with proper table alias
    const qualifiedField = tableAlias ? `"${tableAlias}"."${centerField}"` : `"${centerField}"`;
    const caseStatement = targetCenterIds.map(id => `${qualifiedField} = ${id}`).join(' OR ');
    
    return [
        // First sort by whether the center field matches any of the target center IDs
        [require('sequelize').literal(`CASE WHEN (${caseStatement}) THEN 1 ELSE 0 END`), 'DESC'],
        // Then sort by creation date within each group
        ['createdAt', 'DESC']
    ];
};

/**
 * Add center filtering to where condition
 * @param {Object} whereCondition - Existing where condition object
 * @param {Array} targetCenterIds - Array of target center IDs
 * @param {string} centerField - The field name to match against (default: 'createdBy')
 * @returns {Object} Updated where condition
 */
const addCenterFiltering = (whereCondition = {}, targetCenterIds, centerField = 'createdBy') => {
    if (targetCenterIds.length > 0) {
        whereCondition[centerField] = {
            [Op.in]: targetCenterIds
        };
    }
    // If targetCenterIds is empty, no filtering is applied (returns all centers)
    return whereCondition;
};

/**
 * Process center grouping for API requests
 * This is the main function that combines all the above utilities
 * @param {number|null} centerId - The center ID from payload
 * @param {Object} options - Additional options
 * @param {string} options.centerField - The field name to match against (default: 'createdBy')
 * @param {Array} options.defaultOrder - Default order clause
 * @param {string} options.tableAlias - The table alias to use for the center field (default: '')
 * @returns {Promise<Object>} Complete center grouping information
 */
const processCenterGrouping = async (centerId, options = {}) => {
    const {
        centerField = 'createdBy',
        defaultOrder = [['createdAt', 'DESC']],
        tableAlias = ''
    } = options;

    // Resolve target centers
    const targetInfo = await resolveTargetCenters(centerId);
    
    // Generate sorting order
    const orderClause = generateSortingOrder(targetInfo.targetCenterIds, centerField, defaultOrder, tableAlias);
    
    return {
        ...targetInfo,
        orderClause,
        centerField
    };
};

/**
 * Log center grouping information for debugging
 * @param {Object} groupingInfo - The result from processCenterGrouping
 */
const logGroupingInfo = (groupingInfo) => {
   if (groupingInfo.groupInfo) {
    }
   
};

module.exports = {
    // Configuration
    getCenterGroups,
    getCenterGroupsFromDB,
    clearCenterGroupsCache,
    
    // Core functions
    findCenterGroup,
    resolveTargetCenters,
    processCenterGrouping,
    
    // Helper functions
    generateSortingOrder,
    addCenterFiltering,
    logGroupingInfo
};
