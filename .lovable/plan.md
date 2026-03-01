

## Problem
The `capture="environment"` attribute on the file input forces the device camera to open directly on mobile, bypassing the standard file picker that lets users choose between taking a new photo or selecting from their gallery.

## Fix
Remove the `capture="environment"` attribute from the file input in `src/pages/Project.tsx` (line 377). The `accept="image/*"` attribute alone will trigger the standard mobile file picker, which offers both camera and gallery options.

This is a one-line change.

