from quart import Quart, send_from_directory

app = Quart(__name__)

@app.route('/')
@app.route('/<path:path>')
async def serve_static(path='index.html'):
    if not path.endswith('.html'):
        path += '.html'
    return await send_from_directory('src', path)

# 404 page
@app.errorhandler(404)
async def page_not_found(e):
    return await send_from_directory('src', '404.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
