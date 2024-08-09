import cherrypy
import os
import glob
cherrypy.server.socket_host = '0.0.0.0'

file_pattern = "/usr/app/combined*"
last_size = -1


def file_changed():
  global last_size
  file_to_watch = sorted(glob.glob(file_pattern), reverse=True)[0]
  print(file_to_watch)
  current_size = os.path.getsize(file_to_watch)
  if current_size != last_size:
    file_has_changed = True
  else :
    file_has_changed = False
  last_size = current_size
  return file_has_changed

class HelloWorld:
    @cherrypy.expose
    def healthz(self):
      if file_changed() is True:
        return "OK"
      else:
        raise cherrypy.HTTPError(404, "Page not found")


def error_page_404(status, message, traceback, version):
    cherrypy.response.headers["Content-Type"] = "text/plain"
    return "404 - Page not found"

if __name__ == '__main__':
    cherrypy.config.update({'error_page.404': error_page_404})
    cherrypy.quickstart(HelloWorld())
