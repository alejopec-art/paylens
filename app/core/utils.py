import time
import functools
import random
from typing import Callable, Any

def retry_on_failure(max_retries: int = 3, initial_delay: float = 1.0, backoff_factor: float = 2.0):
    """
    Decorador para implementar reintentos con backoff exponencial.
    Ideal para APIs externas (Meta, Google, Supabase) que pueden fallar temporalmente.
    """
    def decorator(func: Callable[..., Any]):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            delay = initial_delay
            
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    if retries >= max_retries:
                        print(f"SRE ALERT: Máximo de reintentos alcanzado para {func.__name__}. Error: {str(e)}")
                        raise e
                    
                    # Añadimos un pequeño jitter para evitar colisiones de reintentos
                    sleep_time = delay + random.uniform(0, 0.1 * delay)
                    print(f"SRE LOG: Intento {retries} fallido para {func.__name__}. Reintentando en {sleep_time:.2f}s... Error: {str(e)}")
                    time.sleep(sleep_time)
                    
                    delay *= backoff_factor
            
            return None # Nunca debería llegar aquí si max_retries > 0
        return wrapper
    return decorator
