# Change Log

## 0.14.0

-   Submits the expression when the expression input loses focus.
-   Changes text of command "Open a new Debug Visualizer View" to "Debug Visualizer: New View".
-   Adds command "Debug Visualizer: Use Selection as Expression" (Shift+F1)
-   Optimizes load time by splitting code into multiple bundles.
-   Fixes monaco load errors.
-   Sets the mode of the expression input to text rather than typescript, as this extension supports multiple languages.
-   Improves error messages.

## 0.13.0

-   Adds "debugVisualizer.debugAdapterConfigurations" config to customize the expression template.
-   Code Restructuring

## 0.12.1

-   Tries to parse evaluated strings twice as JSON in case of C++/C# escape sequences.

## 0.12.0

-   Generic Debug Adapter Support (tested with PHP, Java, C#)
-   Dark Theme Support
-   Grid Visualizer
-   Some Bugfixes

## 0.11.1

-   Fixes crash on start

## 0.11.0

-   Multiline Expression Input
-   Helper Bundle Injection
-   Plotly Visualizer
-   Object Graph Data Extractor
-   Plotly Data Extractor
-   Some Bugfixes

## 0.10.0

-   Minor refactoring of `@hediet/debug-visualizer-data-extraction`'s API
-   Improved documentation.

## 0.9.0

-   Initial release
