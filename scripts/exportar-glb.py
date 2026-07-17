"""Convierte un archivo Collada de Archicad a GLB con Blender.

Uso:
    blender.exe --background --python scripts/exportar-glb.py -- \
      "<entrada.dae>" "<salida.glb>"
"""

import os
import sys

import bpy


def argumentos() -> tuple[str, str]:
    if "--" not in sys.argv:
        raise SystemExit(
            'Uso: blender --background --python scripts/exportar-glb.py -- '
            '"<entrada.dae>" "<salida.glb>"'
        )

    valores = sys.argv[sys.argv.index("--") + 1 :]
    if len(valores) < 2:
        raise SystemExit("Faltan la ruta de entrada DAE y la ruta de salida GLB.")

    return (os.path.abspath(valores[0]), os.path.abspath(valores[1]))


entrada, salida = argumentos()

if not os.path.isfile(entrada):
    raise SystemExit(f"No existe el archivo DAE: {entrada}")

os.makedirs(os.path.dirname(salida) or ".", exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)

if not hasattr(bpy.ops.wm, "collada_import"):
    raise SystemExit(
        "Esta versión de Blender no incluye el importador Collada. "
        "Activa la extensión oficial de Collada o usa Blender 4.2 LTS."
    )

bpy.ops.wm.collada_import(filepath=entrada)

# Archicad puede dejar nodos de imagen sin archivo asociado. Blender los exporta
# como texturas sin `source`, un GLB inválido para validadores estrictos.
for material in bpy.data.materials:
    if not material.use_nodes or not material.node_tree:
        continue

    nodos = material.node_tree.nodes
    for nodo in list(nodos):
        if nodo.type != "TEX_IMAGE":
            continue

        ruta_imagen = (
            os.path.normpath(bpy.path.abspath(nodo.image.filepath))
            if nodo.image is not None
            else ""
        )

        if (
            nodo.image is None
            or not os.path.isfile(ruta_imagen)
            or os.path.splitext(ruta_imagen)[1].lower() == ".lwi"
        ):
            nodos.remove(nodo)

bpy.ops.export_scene.gltf(
    filepath=salida,
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_image_format="WEBP",
    export_image_quality=70,
    export_apply=True,
)

print(f"OK -> {salida}")
