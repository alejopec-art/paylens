import os


class _Result:
    def __init__(self, data):
        self.data = data


class _Query:
    def __init__(self, client, table: str):
        self._client = client
        self._table = table
        self._method = "GET"
        self._select = None
        self._payload = None
        self._filters = []
        self._limit = None
        self._order = None

    def select(self, columns: str):
        self._method = "GET"
        self._select = columns
        return self

    def insert(self, data):
        self._method = "POST"
        self._payload = data
        return self

    def update(self, data):
        self._method = "PATCH"
        self._payload = data
        return self

    def eq(self, column: str, value):
        self._filters.append((column, "eq", value))
        return self

    def gte(self, column: str, value):
        self._filters.append((column, "gte", value))
        return self

    def gt(self, column: str, value):
        self._filters.append((column, "gt", value))
        return self

    def lte(self, column: str, value):
        self._filters.append((column, "lte", value))
        return self

    def lt(self, column: str, value):
        self._filters.append((column, "lt", value))
        return self

    def ilike(self, column: str, pattern: str):
        self._filters.append((column, "ilike", pattern))
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def order(self, column: str, descending: bool = False):
        self._order = f"{column}.{'desc' if descending else 'asc'}"
        return self

    def execute(self):
        return self._client._execute(self)


from app.core.utils import retry_on_failure

class _SupabaseRestClient:
    def __init__(self, url: str, key: str):
        # ... (constructor remains same)
        self._base = url.rstrip("/") + "/rest/v1"
        self._headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
            "Accept-Profile": "public",
            "Content-Profile": "public",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def table(self, name: str) -> _Query:
        return _Query(self, name)

    @retry_on_failure(max_retries=3, initial_delay=1.0)
    def _execute(self, q: _Query) -> _Result:
        import json
        from urllib.parse import urlencode
        from urllib.request import Request, urlopen
        from urllib.error import HTTPError

        params = {}
        if q._select:
            params["select"] = q._select
        if q._limit is not None:
            params["limit"] = str(q._limit)
        if q._order is not None:
            params["order"] = q._order
        for col, op, val in q._filters:
            if isinstance(val, bool):
                val_s = "true" if val else "false"
            else:
                val_s = str(val)
            params[col] = f"{op}.{val_s}"

        qs = urlencode(params, doseq=True)
        url = f"{self._base}/{q._table}"
        if qs:
            url = f"{url}?{qs}"

        body = None
        if q._payload is not None:
            body = json.dumps(q._payload).encode("utf-8")

        req = Request(url, data=body, headers=self._headers, method=q._method)
        try:
            with urlopen(req, timeout=20) as r:
                raw = r.read()
                if not raw:
                    return _Result([])
                return _Result(json.loads(raw.decode("utf-8")))
        except HTTPError as e:
            err_body = ""
            try:
                err_body = e.read().decode("utf-8")
            except Exception:
                err_body = ""
            raise RuntimeError(f"Supabase REST {e.code}: {err_body or e.reason}")


def get_supabase():
    url = (os.getenv("SUPABASE_URL", "") or "").strip()
    key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or "").strip()

    if not url or not key:
        raise RuntimeError("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos")

    if " " in url or "`" in url or "\n" in url or "\r" in url or "\t" in url:
        raise RuntimeError("SUPABASE_URL inválido (no debe tener espacios/backticks/saltos de línea)")
    if not (url.startswith("https://") or url.startswith("http://")):
        raise RuntimeError("SUPABASE_URL inválido (debe empezar con https://)")
    if key.startswith("sb_publishable_") or key.startswith("sb_anon_"):
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY inválida (usa la service_role: sb_secret_...)")

    return _SupabaseRestClient(url, key)
