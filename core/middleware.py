import time


class DebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        print(f"START: {request.method} {request.path}", flush=True)
        start = time.time()
        response = self.get_response(request)
        print(f"END: {request.path} - {round(time.time() - start, 2)}s", flush=True)
        return response
