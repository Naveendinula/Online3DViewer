import { AddDiv, ClearDomElement } from '../engine/viewer/domutils.js';
import { SidebarPanel } from './sidebarpanel.js';
import { Loc } from '../engine/core/localization.js';
import { getEntityDetails, getBuildingStructure } from './building_structure_model.js';

/**
 * Entity Info Panel - Shows details about the currently selected building structure entity
 */
export class EntityInfoPanel extends SidebarPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.currentEntity = null;
    }

    GetName ()
    {
        return Loc ('Entity Info');
    }

    GetIcon ()
    {
        return 'info';
    }

    Clear ()
    {
        super.Clear ();
        this.currentEntity = null;
    }

    /**
     * Update the panel with the selected entity
     * @param {Object} entity - { entityType, entityId } or null
     */
    UpdateSelectedEntity (entity)
    {
        this.currentEntity = entity;
        ClearDomElement (this.contentDiv);

        if (!entity) {
            this.ShowNoSelection ();
            return;
        }

        const details = getEntityDetails (entity);
        if (!details) {
            this.ShowNoSelection ();
            return;
        }

        this.RenderEntityDetails (details);
    }

    ShowNoSelection ()
    {
        let messageDiv = AddDiv (this.contentDiv, 'ov_entity_info_message');
        messageDiv.textContent = Loc ('Select an entity from the Structure panel or click on the 3D model');
    }

    RenderEntityDetails (details)
    {
        // Header section with entity name and type
        let headerDiv = AddDiv (this.contentDiv, 'ov_entity_info_header');
        
        let typeLabel = this.GetTypeLabel (details.type);
        let typeBadge = AddDiv (headerDiv, 'ov_entity_info_type_badge');
        typeBadge.classList.add ('ov_entity_type_' + details.type);
        typeBadge.textContent = typeLabel;
        
        let nameDiv = AddDiv (headerDiv, 'ov_entity_info_name');
        nameDiv.textContent = details.name;

        // Properties section
        let propsDiv = AddDiv (this.contentDiv, 'ov_entity_info_section');
        let propsTitle = AddDiv (propsDiv, 'ov_entity_info_section_title');
        propsTitle.textContent = Loc ('Properties');
        
        let propsTable = AddDiv (propsDiv, 'ov_property_table');
        
        // ID
        this.AddPropertyRow (propsTable, Loc ('ID'), details.id);
        
        // Type-specific properties
        if (details.type === 'building') {
            this.AddPropertyRow (propsTable, Loc ('Floors'), details.floorCount);
            this.AddPropertyRow (propsTable, Loc ('Zones'), details.zoneCount);
        } else if (details.type === 'floor') {
            this.AddPropertyRow (propsTable, Loc ('Building'), details.buildingName);
            if (details.elevation !== undefined && details.elevation !== null) {
                this.AddPropertyRow (propsTable, Loc ('Elevation'), this.FormatNumber (details.elevation) + ' m');
            }
            this.AddPropertyRow (propsTable, Loc ('Zones'), details.zoneCount);
        } else if (details.type === 'zone') {
            this.AddPropertyRow (propsTable, Loc ('Building'), details.buildingName);
            this.AddPropertyRow (propsTable, Loc ('Floor'), details.floorName);
            if (details.area !== undefined && details.area !== null) {
                this.AddPropertyRow (propsTable, Loc ('Area'), this.FormatNumber (details.area) + ' m²');
            }
            if (details.volume !== undefined && details.volume !== null) {
                this.AddPropertyRow (propsTable, Loc ('Volume'), this.FormatNumber (details.volume) + ' m³');
            }
        }

        // Analytics placeholder sections
        this.RenderAnalyticsPlaceholders ();
    }

    RenderAnalyticsPlaceholders ()
    {
        // Energy KPIs section
        let energyDiv = AddDiv (this.contentDiv, 'ov_entity_info_section ov_entity_info_placeholder');
        let energyTitle = AddDiv (energyDiv, 'ov_entity_info_section_title');
        energyTitle.textContent = Loc ('Energy KPIs');
        let energyContent = AddDiv (energyDiv, 'ov_entity_info_placeholder_content');
        energyContent.textContent = Loc ('Energy data will be available when connected to digital twin');

        // Comfort / CO₂ section
        let comfortDiv = AddDiv (this.contentDiv, 'ov_entity_info_section ov_entity_info_placeholder');
        let comfortTitle = AddDiv (comfortDiv, 'ov_entity_info_section_title');
        comfortTitle.textContent = Loc ('Comfort / CO₂');
        let comfortContent = AddDiv (comfortDiv, 'ov_entity_info_placeholder_content');
        comfortContent.textContent = Loc ('Sensor data will be available when connected to IoT');

        // Occupancy section
        let occupancyDiv = AddDiv (this.contentDiv, 'ov_entity_info_section ov_entity_info_placeholder');
        let occupancyTitle = AddDiv (occupancyDiv, 'ov_entity_info_section_title');
        occupancyTitle.textContent = Loc ('Occupancy');
        let occupancyContent = AddDiv (occupancyDiv, 'ov_entity_info_placeholder_content');
        occupancyContent.textContent = Loc ('Occupancy data will be available when connected to BMS');
    }

    GetTypeLabel (type)
    {
        switch (type) {
            case 'building':
                return Loc ('Building');
            case 'floor':
                return Loc ('Floor');
            case 'zone':
                return Loc ('Zone');
            default:
                return Loc ('Unknown');
        }
    }

    AddPropertyRow (table, name, value)
    {
        let row = AddDiv (table, 'ov_property_table_row');
        let nameCell = AddDiv (row, 'ov_property_table_cell ov_property_table_name');
        nameCell.textContent = name;
        let valueCell = AddDiv (row, 'ov_property_table_cell ov_property_table_value');
        valueCell.textContent = value !== undefined && value !== null ? value : '-';
    }

    FormatNumber (value)
    {
        if (typeof value === 'number') {
            return value.toFixed (2);
        }
        return value;
    }

    /**
     * Show building overview when no specific entity is selected but building exists
     */
    ShowBuildingOverview ()
    {
        const structure = getBuildingStructure ();
        if (structure) {
            this.UpdateSelectedEntity ({ entityType: 'building', entityId: structure.id });
        } else {
            this.ShowNoSelection ();
        }
    }
}
