import { GetDomElementOuterWidth, SetDomElementOuterHeight, SetDomElementOuterWidth } from '../engine/viewer/domutils.js';
import { PanelSet } from './panelset.js';
import { SidebarAnalyticsPanel } from './sidebaranalyticspanel.js';
import { SidebarDetailsPanel } from './sidebardetailspanel.js';
import { SidebarSettingsPanel } from './sidebarsettingspanel.js';
import { EntityInfoPanel } from './entityinfopanel.js';

export class Sidebar
{
    constructor (mainDiv, settings)
    {
        this.mainDiv = mainDiv;
        this.panelSet = new PanelSet (mainDiv);

        this.entityInfoPanel = new EntityInfoPanel (this.panelSet.GetContentDiv ());
        this.analyticsPanel = new SidebarAnalyticsPanel (this.panelSet.GetContentDiv ());
        this.detailsPanel = new SidebarDetailsPanel (this.panelSet.GetContentDiv ());
        this.settingsPanel = new SidebarSettingsPanel (this.panelSet.GetContentDiv (), settings);

        this.panelSet.AddPanel (this.entityInfoPanel);
        this.panelSet.AddPanel (this.analyticsPanel);
        this.panelSet.AddPanel (this.detailsPanel);
        this.panelSet.AddPanel (this.settingsPanel);
        this.panelSet.ShowPanel (this.entityInfoPanel);
    }

    IsPanelsVisible ()
    {
        return this.panelSet.IsPanelsVisible ();
    }

    ShowPanels (show)
    {
        this.panelSet.ShowPanels (show);
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;

        this.panelSet.Init ({
            onResizeRequested : () => {
                this.callbacks.onResizeRequested ();
            },
            onShowHidePanels : (show) => {
                this.callbacks.onShowHidePanels (show);
            }
        });

        this.settingsPanel.Init ({
            getShadingType : () => {
                return this.callbacks.getShadingType ();
            },
            getProjectionMode : () => {
                return this.callbacks.getProjectionMode ();
            },
            getDefaultMaterials : () => {
                return this.callbacks.getDefaultMaterials ();
            },
            onEnvironmentMapChanged : () => {
                this.callbacks.onEnvironmentMapChanged ();
            },
            onBackgroundColorChanged : () => {
                this.callbacks.onBackgroundColorChanged ();
            },
            onDefaultColorChanged : () => {
                this.callbacks.onDefaultColorChanged ();
            },
            onEdgeDisplayChanged : () => {
                this.callbacks.onEdgeDisplayChanged ();
            }
        });
    }

    UpdateControlsStatus ()
    {
        this.settingsPanel.UpdateControlsStatus ();
    }

    UpdateControlsVisibility ()
    {
        this.settingsPanel.UpdateControlsVisibility ();
    }

    Resize (height)
    {
        SetDomElementOuterHeight (this.mainDiv, height);
        this.panelSet.Resize ();
    }

    GetWidth ()
    {
        return GetDomElementOuterWidth (this.mainDiv);
    }

    SetWidth (width)
    {
        SetDomElementOuterWidth (this.mainDiv, width);
    }

    Clear ()
    {
        this.panelSet.Clear ();
    }

    UpdateAnalytics (model)
    {
        this.analyticsPanel.UpdateAnalytics (model);
    }

    AddObject3DProperties (model, object3D)
    {
        this.detailsPanel.AddObject3DProperties (model, object3D);
    }

    AddMaterialProperties (material)
    {
        this.detailsPanel.AddMaterialProperties (material);
    }

    /**
     * Update the entity info panel with the selected entity
     * @param {Object} entity - { entityType, entityId } or null
     */
    UpdateEntityInfo (entity)
    {
        this.entityInfoPanel.UpdateSelectedEntity (entity);
        // Switch to entity info panel when an entity is selected
        if (entity) {
            this.panelSet.ShowPanel (this.entityInfoPanel);
        }
    }

    /**
     * Show building overview in the entity info panel
     */
    ShowBuildingOverview ()
    {
        this.entityInfoPanel.ShowBuildingOverview ();
    }
}
