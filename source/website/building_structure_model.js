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
