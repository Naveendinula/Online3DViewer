# Building Analytics Viewer Architecture

This document outlines the architectural changes made to transform the generic 3D viewer into a Building Analytics Viewer.

## Overview

The application has been restructured to focus on Building Information Modeling (BIM) workflows, specifically:
1.  **Hierarchical Building Navigation**: Viewing models by Levels/Floors.
2.  **Analytics Dashboard**: Displaying KPIs and Charts related to building performance.

## Key Components

### 1. NavigatorBuildingPanel (`source/website/navigatorbuildingpanel.js`)
-   **Purpose**: Replaces the flat mesh list with a structured tree view.
-   **Logic**: Currently uses a heuristic (Y-coordinate clustering) to group meshes into "Levels" if explicit building structure is missing.
-   **Integration**: Added to `Navigator` as the default tab.

### 2. SidebarAnalyticsPanel (`source/website/sidebaranalyticspanel.js`)
-   **Purpose**: Displays analytics data (KPIs, Charts).
-   **Logic**: Fetches data from `AnalyticsService` and renders HTML-based cards.
-   **Integration**: Added to `Sidebar` as the default tab.

### 3. AnalyticsService (`source/website/analytics_service.js`)
-   **Purpose**: Provides a data layer for analytics.
-   **Current State**: Returns mock data based on model statistics.
-   **Future**: Connect this to a real backend API.

## Data Flow

1.  **Model Load**: `Website.OnModelLoaded` is triggered.
2.  **Structure Generation**: `NavigatorBuildingPanel.Fill(model)` iterates meshes and builds the Level tree.
3.  **Analytics Update**: `Sidebar.UpdateAnalytics(model)` calls `AnalyticsService.GetBuildingStats(model)` and updates the UI.

## How to Extend

### Adding Real Analytics
1.  Modify `AnalyticsService.GetBuildingStats` to fetch data from your API.
2.  Ensure the API returns data keyed by Building ID or Model Hash.

### Improving Building Structure
1.  If using IFC, enhance `ImporterIfc` to populate a proper `Node` hierarchy in the `Model` class.
2.  Update `NavigatorBuildingPanel` to traverse this hierarchy instead of using the Y-coordinate heuristic.
