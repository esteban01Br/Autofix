"""Prueba de humo: la app arranca y responde en la raíz.

Importar `app.main` ejercita todos los routers; si un módulo tiene un
NombreError (por ejemplo un import faltante como `date`, `datetime` o
`time`), la colección de tests falla aquí en vez de en producción.
"""


def test_raiz_responde_200(client):
    resp = client.get("/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos.get("estado") == "operativo"
    assert "documentacion" in datos
