"""Seed data para poblar la base de datos en el primer arranque."""
from sqlmodel import Session, select

from app.models.biblioteca import (
    BibliotecaGrupo,
    BibliotecaItem,
    BibliotecaLinea,
)
from app.models.cotizacion import CotNumeroCounter

LINEAS_BASE = [
    "Zona Franca",
    "Depósito Aduanero",
    "CEDI",
    "Transporte",
    "Paqueteo",
    "Aduana",
]

SEED_ZONA_FRANCA = {
    "Almacenamiento": [
        ("Ad Valorem",          "0,36%",   "porcentaje", "Del valor CIF de la mercancía"),
        ("Mínima aérea / LCL",  "237.600", "moneda",     "Por documento de transporte"),
        ("Contenedor 20 pies",  "559.900", "moneda",     "Por contenedor"),
        ("Contenedor 40 pies",  "748.000", "moneda",     "Por contenedor"),
    ],
    "Manipulación de Mercancía": [
        ("Ad Valorem",          "42%",     "porcentaje", "Del peso total ingresado"),
        ("Mínima aérea / LCL",  "42.900",  "moneda",     "Por documento de transporte"),
        ("Contenedor 20 pies",  "398.200", "moneda",     "Por contenedor"),
        ("Contenedor 40 pies",  "569.800", "moneda",     "Por contenedor"),
    ],
}


def seed_biblioteca(session: Session) -> None:
    """Crea las 6 líneas base y el seed de Zona Franca si la biblioteca está vacía."""
    if session.exec(select(BibliotecaLinea)).first():
        return  # ya tiene datos

    lineas: dict[str, BibliotecaLinea] = {}
    for orden, nombre in enumerate(LINEAS_BASE):
        linea = BibliotecaLinea(nombre=nombre, orden=orden)
        session.add(linea)
        lineas[nombre] = linea

    session.flush()  # genera IDs antes de usarlos en grupos

    zf = lineas["Zona Franca"]
    for g_orden, (grupo_nombre, items) in enumerate(SEED_ZONA_FRANCA.items()):
        grupo = BibliotecaGrupo(linea_id=zf.id, nombre=grupo_nombre, orden=g_orden)
        session.add(grupo)
        session.flush()

        for i_orden, (nombre, tarifa, tipo_tarifa, obs) in enumerate(items):
            session.add(BibliotecaItem(
                grupo_id=grupo.id,
                nombre=nombre,
                tarifa=tarifa,
                tipo_tarifa=tipo_tarifa,
                obs=obs,
                orden=i_orden,
            ))

    session.commit()
    print("[seed] Biblioteca base creada.")


def seed_cot_counter(session: Session) -> None:
    """Inicializa el singleton de numeración atómica si no existe."""
    if not session.get(CotNumeroCounter, 1):
        session.add(CotNumeroCounter(id=1, counter=0))
        session.commit()
        print("[seed] CotNumeroCounter inicializado.")
