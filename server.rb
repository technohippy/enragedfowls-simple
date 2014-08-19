require 'webrick'

s = WEBrick::HTTPServer.new(:Port => 10088, :DocumentRoot => Dir.pwd)
trap('INT') { s.shutdown }
s.start
