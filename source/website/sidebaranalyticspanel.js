import { AddDiv } from '../engine/viewer/domutils.js';
import { SidebarPanel } from './sidebarpanel.js';
import { Loc } from '../engine/core/localization.js';
import { AnalyticsService } from './analytics_service.js';

export class SidebarAnalyticsPanel extends SidebarPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
    }

    GetName ()
    {
        return Loc ('Analytics');
    }

    GetIcon ()
    {
        return 'details'; // Using 'details' icon as placeholder
    }

    Init (callbacks)
    {
        super.Init (callbacks);
        this.Clear();
        AddDiv (this.contentDiv, 'ov_analytics_title', Loc ('No model loaded.'));
    }

    UpdateAnalytics (model)
    {
        this.Clear();
        if (!model) {
             AddDiv (this.contentDiv, 'ov_analytics_title', Loc ('No model loaded.'));
             return;
        }

        let stats = AnalyticsService.GetBuildingStats(model);

        this.CreateKPIGroup (Loc ('Building Performance'), [
            { label: Loc ('EUI (kBtu/ft²)'), value: stats.eui },
            { label: Loc ('Carbon (kgCO2e)'), value: stats.carbon }
        ]);

        this.CreateChartGroup (Loc ('Energy Consumption'), 'Energy Usage over Time');

        this.CreateKPIGroup (Loc ('Occupancy'), [
            { label: Loc ('Current'), value: stats.occupancy + '%' },
            { label: Loc ('Capacity'), value: stats.capacity }
        ]);

        this.CreateChartGroup (Loc ('Temperature Distribution'), 'Heatmap Placeholder');
    }

    CreateKPIGroup (title, kpis)
    {
        let section = AddDiv (this.contentDiv, 'ov_analytics_section');
        AddDiv (section, 'ov_analytics_title', title);
        let container = AddDiv (section, 'ov_kpi_container');

        for (let kpi of kpis) {
            let card = AddDiv (container, 'ov_kpi_card');
            AddDiv (card, 'ov_kpi_value', kpi.value);
            AddDiv (card, 'ov_kpi_label', kpi.label);
        }
    }

    CreateChartGroup (title, placeholderText)
    {
        let section = AddDiv (this.contentDiv, 'ov_analytics_section');
        AddDiv (section, 'ov_analytics_title', title);
        let container = AddDiv (section, 'ov_chart_container');
        let placeholder = AddDiv (container, 'ov_chart_placeholder');
        placeholder.innerHTML = placeholderText;
    }
}
