/**
 * Building Structure Model
 * 
 * Manages the hierarchical structure of the building (Building -> Floors -> Zones)
 * and mappings between 3D geometry and semantic entities.
 */

/**
 * @typedef {Object} SelectedEntity
 * @property {('building'|'floor'|'zone')} entityType
 * @property {string} entityId
 */

/**
 * @typedef {Object} ZoneNode
 * @property {string} id - ExpressID or unique identifier
 * @property {string} name
 * @property {number} [area]
 * @property {number} [volume]
 */

/**
 * @typedef {Object} FloorNode
 * @property {string} id - ExpressID or unique identifier
 * @property {string} name
 * @property {number} [elevation]
 * @property {ZoneNode[]} zones
 */

/**
 * @typedef {Object} BuildingNode
 * @property {string} id - ExpressID or unique identifier
 * @property {string} name
 * @property {FloorNode[]} floors
 */

/**
 * @typedef {Map<string, any>} EntityToGeometryMap
 * Maps Entity ID (e.g. ExpressID) to Mesh/Geometry object(s)
 */

/**
 * @typedef {Map<any, string>} GeometryToEntityMap
 * Maps Mesh/Geometry object to Entity ID
 */

class BuildingStructureModel {
    constructor() {
        /** @type {BuildingNode|null} */
        this.buildingStructure = null;
        
        /** @type {EntityToGeometryMap} */
        this.entityToGeometry = new Map();
        
        /** @type {GeometryToEntityMap} */
        this.geometryToEntity = new Map();
    }

    /**
     * @returns {BuildingNode|null}
     */
    getBuildingStructure() {
        return this.buildingStructure;
    }

    /**
     * @returns {EntityToGeometryMap}
     */
    getEntityToGeometryMap() {
        return this.entityToGeometry;
    }

    /**
     * @returns {GeometryToEntityMap}
     */
    getGeometryToEntityMap() {
        return this.geometryToEntity;
    }

    /**
     * Sets the building structure data
     * @param {BuildingNode} structure 
     */
    setBuildingStructure(structure) {
        this.buildingStructure = structure;
    }

    /**
     * Sets the mapping data
     * @param {EntityToGeometryMap} entityToGeo 
     * @param {GeometryToEntityMap} geoToEntity 
     */
    setMaps(entityToGeo, geoToEntity) {
        this.entityToGeometry = entityToGeo;
        this.geometryToEntity = geoToEntity;
    }

    /**
     * Clears all data
     */
    clear() {
        this.buildingStructure = null;
        this.entityToGeometry.clear();
        this.geometryToEntity.clear();
    }
}

// Singleton instance
const buildingStructureModel = new BuildingStructureModel();

export function getBuildingStructure() {
    return buildingStructureModel.getBuildingStructure();
}

export function getGeometryToEntityMap() {
    return buildingStructureModel.getGeometryToEntityMap();
}

export function getEntityToGeometryMap() {
    return buildingStructureModel.getEntityToGeometryMap();
}

export function setBuildingStructureData(structure, entityToGeo, geoToEntity) {
    buildingStructureModel.setBuildingStructure(structure);
    buildingStructureModel.setMaps(entityToGeo, geoToEntity);
}

export function clearBuildingStructureData() {
    buildingStructureModel.clear();
}

/**
 * Gets all expressIDs associated with an entity (building, floor, or zone)
 * For building: returns all expressIDs in the model
 * For floor: returns the floor expressID + all zone expressIDs on that floor
 * For zone: returns just the zone expressID
 * 
 * @param {SelectedEntity} entity - The selected entity
 * @returns {Set<number>} Set of expressIDs
 */
export function getExpressIdsForEntity(entity) {
    const expressIds = new Set();
    const structure = buildingStructureModel.getBuildingStructure();
    
    if (!structure || !entity) {
        return expressIds;
    }
    
    const entityId = typeof entity.entityId === 'string' ? parseInt(entity.entityId) : entity.entityId;
    
    if (entity.entityType === 'building') {
        // Add building expressID
        expressIds.add(structure.id);
        
        // Add all floors and their zones
        if (structure.floors) {
            for (const floor of structure.floors) {
                expressIds.add(floor.id);
                if (floor.zones) {
                    for (const zone of floor.zones) {
                        expressIds.add(zone.id);
                    }
                }
            }
        }
    } else if (entity.entityType === 'floor') {
        // Find the floor and add it + all its zones
        if (structure.floors) {
            for (const floor of structure.floors) {
                if (floor.id === entityId) {
                    expressIds.add(floor.id);
                    if (floor.zones) {
                        for (const zone of floor.zones) {
                            expressIds.add(zone.id);
                        }
                    }
                    break;
                }
            }
        }
    } else if (entity.entityType === 'zone') {
        // Just add the zone expressID
        expressIds.add(entityId);
    }
    
    return expressIds;
}

/**
 * Gets geometry mesh instances for a set of expressIDs
 * @param {Set<number>} expressIds - Set of expressIDs to look up
 * @returns {Array} Array of mesh instances
 */
export function getMeshInstancesForExpressIds(expressIds) {
    const meshInstances = [];
    const entityToGeo = buildingStructureModel.getEntityToGeometryMap();
    
    for (const expressId of expressIds) {
        if (entityToGeo.has(expressId)) {
            meshInstances.push(entityToGeo.get(expressId));
        }
    }
    
    return meshInstances;
}

/**
 * Resolves an expressID to its most specific entity type (zone > floor > building)
 * @param {number} expressId - The expressID to look up
 * @returns {SelectedEntity|null} The entity info or null if not found
 */
export function getEntityForExpressId(expressId) {
    const structure = buildingStructureModel.getBuildingStructure();
    
    if (!structure) {
        return null;
    }
    
    // Check if it's the building itself
    if (structure.id === expressId) {
        return { entityType: 'building', entityId: structure.id };
    }
    
    // Search through floors and zones (prefer most specific: zone > floor)
    if (structure.floors) {
        for (const floor of structure.floors) {
            // Check zones first (most specific)
            if (floor.zones) {
                for (const zone of floor.zones) {
                    if (zone.id === expressId) {
                        return { entityType: 'zone', entityId: zone.id };
                    }
                }
            }
            
            // Check floor
            if (floor.id === expressId) {
                return { entityType: 'floor', entityId: floor.id };
            }
        }
    }
    
    return null;
}

/**
 * Gets the parent floor for a zone
 * @param {number} zoneId - The zone expressID
 * @returns {FloorNode|null} The parent floor or null
 */
export function getParentFloorForZone(zoneId) {
    const structure = buildingStructureModel.getBuildingStructure();
    
    if (!structure || !structure.floors) {
        return null;
    }
    
    for (const floor of structure.floors) {
        if (floor.zones) {
            for (const zone of floor.zones) {
                if (zone.id === zoneId) {
                    return floor;
                }
            }
        }
    }
    
    return null;
}

/**
 * Gets detailed information about an entity for display in info panel
 * @param {SelectedEntity} entity - The selected entity
 * @returns {Object|null} Entity details or null
 */
export function getEntityDetails(entity) {
    const structure = buildingStructureModel.getBuildingStructure();
    
    if (!structure || !entity) {
        return null;
    }
    
    const entityId = typeof entity.entityId === 'string' ? parseInt(entity.entityId) : entity.entityId;
    
    if (entity.entityType === 'building') {
        const floorCount = structure.floors ? structure.floors.length : 0;
        let zoneCount = 0;
        if (structure.floors) {
            for (const floor of structure.floors) {
                zoneCount += floor.zones ? floor.zones.length : 0;
            }
        }
        
        return {
            type: 'building',
            name: structure.name || 'Building',
            id: structure.id,
            floorCount: floorCount,
            zoneCount: zoneCount
        };
    } else if (entity.entityType === 'floor') {
        if (structure.floors) {
            for (const floor of structure.floors) {
                if (floor.id === entityId) {
                    return {
                        type: 'floor',
                        name: floor.name || 'Floor',
                        id: floor.id,
                        elevation: floor.elevation,
                        zoneCount: floor.zones ? floor.zones.length : 0,
                        buildingName: structure.name || 'Building'
                    };
                }
            }
        }
    } else if (entity.entityType === 'zone') {
        if (structure.floors) {
            for (const floor of structure.floors) {
                if (floor.zones) {
                    for (const zone of floor.zones) {
                        if (zone.id === entityId) {
                            return {
                                type: 'zone',
                                name: zone.name || 'Zone',
                                id: zone.id,
                                area: zone.area,
                                volume: zone.volume,
                                floorName: floor.name || 'Floor',
                                floorId: floor.id,
                                buildingName: structure.name || 'Building'
                            };
                        }
                    }
                }
            }
        }
    }
    
    return null;
}
