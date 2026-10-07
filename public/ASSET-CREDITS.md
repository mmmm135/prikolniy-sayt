# External artwork and animated models

## Studio hand engraving

`art/studio-hand.jpg`: original source created once with the built-in imagegen tool for POUDEV. Prompt: "Quiet grayscale photograph of one anatomically correct adult right hand holding a sharpened wooden pencil in a natural drawing grip. Wrist exits the right edge, pencil points lower-left. Landscape 3:2, empty black left third, soft ivory highlights and detailed skin texture. No paper, writing, text, logos, symbols or additional objects." JPEG encoded for the web; sampled into two-colour engraved strokes. The pencil moves with the scroll and follows the reveal of the POUDEV lettering, then leaves the stage before the direct-conversation sequence. A visual metaphor for personal work, not a photograph of a claimed studio employee.

## Bird Flight Animation
Pikawut, CC BY 4.0. Geometry and original animation used; converted to monochrome engraved rendering.
Source: https://sketchfab.com/3d-models/bird-flight-animation-e4b42d0abc1b495abf236c60cd6d729f
GLB mirror: https://github.com/Someone030/polypizaz/blob/main/glb/hw6/bird_flight_animation.glb
License: https://creativecommons.org/licenses/by/4.0/
The author, source and license are embedded in the GLB asset metadata.

## Fox
Model: PixelMannen (CC0); rigging and animations: tomkranis (CC BY 4.0); glTF conversion: AsoboStudio and scurest (CC BY 4.0).
Source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox
Converted to engraved monochrome rendering. Original animations retained.

## Wooded Landscape with a Pond, 1650
Jacob van Ruisdael. Public domain. Adapted into a monochrome engraved landscape.
Source: https://commons.wikimedia.org/wiki/File:Jacob_van_Ruisdael_-_Wooded_Landscape_with_a_Pond_-_d5403335a.jpg

## Opening landscape
Existing project artwork retained from the previous iteration; no new generated models, video or artwork added.

## Botanical plates
Pierre-Joseph Redouté, Les Roses, 1824. Public domain.
https://commons.wikimedia.org/wiki/File:Redoute_-_Rosa_centifolia_foliacea.jpg
https://commons.wikimedia.org/wiki/File:Redoute_-_Rosa_gallica_regalis.jpg

## Hibiscus blooming time-lapse
Pixabay via Pexels. Original filmed flower-opening motion retained; blue background removed and frames converted to monochrome engraving.
Source: https://www.pexels.com/video/beautiful-flowers-blooming-856030/
License: https://www.pexels.com/license/


## Geranium blooming time-lapse (current botanical section)
Pixabay via Pexels. Original flower-opening footage, adapted to monochrome engraving.
Source: https://www.pexels.com/video/flowers-blooming-855867/
License: https://www.pexels.com/license/


## Blooming rose footage
Alex Tr, 2015. [Original video](https://commons.wikimedia.org/wiki/File:Time-lapse_of_opening_red_rose_isolated_on_black_background.Blooming_red_roses_flower_buds.webm), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Cropped, mirrored and converted to a two-colour animated engraving.

## Work-scene landscape
Jean-Baptiste Camille Corot, Forest Clearing in the Limousin (1845–1850). Image uploaded by Maltaper, Wikimedia Commons, CC BY-SA 4.0. Source: https://commons.wikimedia.org/wiki/File:Corot_-_Forest_Clearing_in_the_Limousin,_circa_1845-1850.jpg . Animated monochrome engraving adaptation licensed CC BY-SA 4.0.
Work-scene bird: Parrot.glb from the three.js example asset collection: https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/Parrot.glb .

Natural arch: J Dykstra, Natural arch on Macinac Island (2009), CC0. https://commons.wikimedia.org/wiki/File:Natural_arch_on_Macinac_Island.jpg . Cropped and translated into animated engraving.

Work-scene stork: Stork.glb, animated model from the three.js example collection. Source: https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/Stork.glb . Replaces the work-scene parrot.

## Carousel wildlife footage (current)
Herd of Deer Grazing in a Meadow, Alin Buda, Pexels video 12562405. https://www.pexels.com/video/herd-of-deer-grazing-in-a-meadow-12562405/ . Pexels License: https://www.pexels.com/license/ . Forward-only filmed movement with a short blended loop seam. Foreground masks tracked with optical flow and refined against the original frame colours; adapted to monochrome engraving.

Sprouted Carrot, Pixabay via Pexels video 856994. https://www.pexels.com/video/sprouted-carrot-856994/ . Pexels License: https://www.pexels.com/license/ . Original filmed unfurling foliage retained, root cropped out, green foreground isolated from the dark background without inferred masks, and converted to monochrome engraving. Leaf development plays once, followed by continuous gentle wind.

Carousel birds: Flamingo.glb from the three.js example collection, https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/Flamingo.glb . Original morph animation retained; independent flight paths, phase offsets, and monochrome engraved rendering.
Concept editorial photographs: Unsplash image IDs photo-1509440159596-0249088772ff, photo-1490750967868-88aa4486c946, photo-1442512595331-e89e73853f31, photo-1600210492486-724fe5c67fb0, photo-1552053831-71594a27632d. Unsplash license: https://unsplash.com/license . Mood imagery; not asserted to depict these businesses.

## Current carousel engraving composition

`work-herd-meadow.mp4`: Alin Buda's grazing deer footage (Pexels 12562405, credited above). Seven seconds of forward motion with refined, tracked animal masks; a half-second dissolve joins the loop. Colour and matte are packed side by side. Static poster extracted from the same footage for reduced motion and video-loading fallback.

Current upper-right bough: **Shrub 04 by Rico Cilliers / Poly Haven**, CC0. Source: https://polyhaven.com/a/shrub_04 . License: https://polyhaven.com/license . One complete branch is extracted from the original four-branch model by `scripts/prepare-natural-branch.mjs`; original geometry, UVs, leaf silhouettes, bark, colour, normal, roughness and alpha textures are retained as the sampling source. Attachment metadata enables individual leaf opening and bending around the original twig. Scroll unfolds the shoot and leaves in both directions, with damped follow and flexion in response to scroll speed. A slow travelling breeze moves attached leaves at different phases. The pose is deterministic for the same scroll, breeze phase and impulse. Reduced motion uses a fixed, open pose. The former procedural laurel, whole-tree illustration and filmed autumn branch are not used.

The current branch is reconstructed from sampled engraving cells, including leaf and twig outlines; no continuous model silhouette clips the strokes. The original lit surface is used only to determine the width of each ink mark.

Current carousel birds use the existing `work-stork.glb` asset from the three.js example collection (source credited above), with original wing morph animation, independent flight paths and phase offsets. The former carrot growth, filmed canopy and flamingo assets are no longer used by this carousel.

## Contact meadow

Grass Medium 01: model by Rico Cilliers, photographs by Rob Tuytel, Poly Haven, CC0. https://polyhaven.com/a/grass_medium_01 . Original geometry and UVs retained; textures optimized, plants instanced, animated wind and engraving rendering added. https://polyhaven.com/license

Butterfly model by **Tyler Lazzareschi**, licensed **CC BY 4.0**: https://sketchfab.com/3d-models/butterfly-49d5ad3857b24f10a8bfc428b4670a33 . https://creativecommons.org/licenses/by/4.0/ . Rig and wing animation by **Jiajun Li, Haoquan Liang and Shineng Tang**, obtained from https://github.com/Li-Jia-Jun/WebGPU-Butterfly . Modifications: optimized textures, unused textures removed, scroll-driven flight, camera choreography and monochrome engraving. Original anatomy, skeleton and animation retained.

Current solo flower: **Flower by Artec 3D**, a real 3D scan of an orchid, **CC BY 4.0**. Source and original download: https://www.artec3d.com/3d-models/flower . Licence: https://creativecommons.org/licenses/by/4.0/ . Original scanned petal geometry and texture retained; coordinate system normalized, duplicated vertices welded, surface normals smoothed, narrow original stalk lengthened, and textures/geometry compressed. The visible flower and butterfly are reconstructed entirely from coarse, broken ink strokes; their original photographic surfaces are not displayed. Butterfly wing hinges are articulated from scroll during flight and from a slow clock only after touchdown. Petal contact is raycast against the original scan.
