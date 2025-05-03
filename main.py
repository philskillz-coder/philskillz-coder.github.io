from quart import Quart, send_from_directory, render_template

app = Quart(__name__)

@app.route('/')
async def index():
    return await render_template('index.html')

@app.route("/helloworld")
async def hello_world():
    return await render_template('helloworld.html')

@app.route("/rentner")
async def rentner():
    return await render_template('rentner.html')

@app.route("/stats")
async def stats():
    return await render_template('stats.html')

@app.route("/assets/<path:filename>")
async def send_assets(filename):
    return await send_from_directory('assets', filename)

# 404 page
@app.errorhandler(404)
async def page_not_found(e):
    return await render_template('404.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
