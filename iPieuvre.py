#!/usr/bin/python2.5
# -*- coding: utf-8 -*-
#
# iPieuvre est un aggrégateur d'albums PicasaWeb stockés sur plusieurs comptes.
#
# Copyright 2009 Tifauve Labs = http://www.tifauve.net
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.




__author__ = 'Julien Raigneau'
VERSION = "0.6"

import gdata.photos.service
import gdata.media
import gdata.geo

from Cheetah.Template import Template

from time import strftime,strptime
import locale
import sys,os,logging
import yaml

class FetchPicasa:
#http://code.google.com/intl/fr/apis/picasaweb/developers_guide_protocol.html

  def __init__(self,config):
    self.config = config
    self.myalbums = self.get_albums()
    self.numalbums = self.get_numalbums()
    self.numphotosalbums = self.get_numphotosalbums()
    self.recentalbum = self.get_recentalbum()


  def get_albums(self):
    accountsList = self.config["accounts"]

    myalbums = [] #contient tous les albums picasa web

    for account in accountsList:
      email = account["email"]
      pwd = account["pwd"]

      logging.info('get_albums: Authentification en cours sur %s' % email)

      gd_client = gdata.photos.service.PhotosService()
      gd_client.email = email   # Set your Picasaweb e-mail address...
      gd_client.password = pwd  # ... and password
      gd_client.source = 'api-sample-google-com'
      gd_client.ProgrammaticLogin()

      logging.info('get_albums: Récupération des albums...')
      albums = gd_client.GetUserFeed()

      for album in albums.entry: #on parse les albums dispo sur le compte
        album_title = album.title.text

        logging.info('get_albums: Traitement de %s' % album_title)
        
        album_picasa_url = album.GetHtmlLink().href
        album_url = "photos/%s.html" % album_title
        album_numphotos = int(album.numphotos.text)
        album_thumbnail = album.media.thumbnail[0].url
        album_published = strptime(album.published.text,"%Y-%m-%dT%H:%M:%S.000Z")

        logging.info('get_albums: Récupération des photos...')
        photos = gd_client.GetFeed('/data/feed/api/user/%s/albumid/%s?kind=photo' % ('default', album.gphoto_id.text))
        myphotos = []
        for photo in photos.entry:
          photo_thumbnail = photo.media.thumbnail[1].url
          photo_url = photo_thumbnail.replace("s144","s720")
          photo_title = photo.title.text
          onephoto = {"title":photo_title,"url":photo_url,"thumbnail":photo_thumbnail}
          myphotos.append(onephoto)
          
        myalbum = {"url":album_url,"title":album_title,"numphotos":album_numphotos,"thumbnail":album_thumbnail,"published":album_published,"photos":myphotos,"picasa_url":album_picasa_url }
        #print myalbum
        myalbums.append(myalbum)
        logging.info('get_albums: Traitement de %s TERMINE' % album_title)

    return myalbums

  def get_numalbums(self):
    return len(self.myalbums)

  def get_numphotosalbums(self):
    numphotosalbums = 0

    for album in self.myalbums:
      numphotosalbums = numphotosalbums + album['numphotos']
    return numphotosalbums

  def get_recentalbum(self):
    if len(self.myalbums)>0:
      recentalbum = self.myalbums[0]
    else:
      return None
    
    for album in self.myalbums:
      if recentalbum["published"] < album["published"]:
        recentalbum = album
    return recentalbum



class FetchVideo:

  def __init__(self):
    self.myvideos = self.get_videos()
    self.numvideos = self.get_numvideos()
    self.recentvideo = self.get_recentvideo()

  def get_videos(self):
    myvideos = [] #contient toutes les videos
    videopath = os.path.join(sys.path[0],'videos')
    fileList=os.listdir(videopath)
    for f in fileList:
      if f.find("jpg") > -1:
        video_title = f.replace(".jpg","")

        logging.info('get_videos: Traitement de %s' % video_title)
        
        video_thumbnail = "videos/%s" % f
        video_url = "videos/%s " % f.replace(".jpg",".html")
        myvideo = {"title":video_title,"thumbnail":video_thumbnail,"url":video_url}
        myvideos.append(myvideo)

        videofiller = {"title":video_title, "url_video": "%s" % f.replace(".jpg",".flv"),"url_pic": "%s" % f}
        t = Template(file="templateVideo.tmpl",searchList=[videofiller])
        file = open("%s/%s" % (videopath, f.replace(".jpg",".html")), 'w')
        file.write(str(t))
        file.close()

        logging.info('get_videos: Traitement de %s TERMINE' % video_title)
        
        
    return myvideos

  def get_numvideos(self):
    return len(self.myvideos)

  def get_recentvideo(self):
    if len(self.myvideos)>0:
      return self.myvideos[-1]
    else:
      return None
 

##Début script

if __name__ == '__main__':
  print "iPieuvre v"+VERSION+" (C) 2009 J.RAIGNEAU"
  
  logFile = os.path.join(sys.path[0],"iPieuvre.log")
  logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s %(levelname)s %(message)s',
                    filename=logFile,
                      filemode='w')
  logging.info("main: == iPieuvre v%s (C) 2009 J.RAIGNEAU ==" % VERSION)
  try:
    fichier = os.path.join(sys.path[0],"iPieuvre.yaml")
    confFile = file(fichier, 'r')    # 'document.yaml' contains a single YAML document.
    config = yaml.load(confFile)
    confFile.close()
  except IOError:
    logging.error("le fichier %s n'existe pas ou est incorrect" % fichier)
    sys.exit(-1)
  except:
    logging.error("erreur lors de l'importation des données de configuration")
    sys.exit(-1)
  
  
  locale.setlocale(locale.LC_ALL, "fr_FR.utf8")
  dateupdate = strftime("%d %B %Y")
  globalfiller = {'dateupdate':dateupdate}

  #Fetch picasa stuff
  print "Fetching PicasaWeb..."
  logging.info('main: == Traitement Photos==')
  picasa = FetchPicasa(config)
  globalfiller['numalbums']=picasa.numalbums
  globalfiller['numphotosalbums']=picasa.numphotosalbums
  globalfiller['recentalbum']=picasa.recentalbum


  print "Fetching Videos..."
  logging.info('main: == Traitement Vidéos==')
  video = FetchVideo()
  globalfiller['numvideos']=video.get_numvideos
  globalfiller['recentvideo']=video.get_recentvideo


  #Write Album photo
  logging.info('main: == Création Albums Photos ==')
  albumsfiller={'myalbums':picasa.myalbums,'photo_css_class':'class="active"','video_css_class':''}
  t = Template(file="template.tmpl",searchList=[globalfiller,albumsfiller])
  file = open("index.html", 'w')
  file.write(str(t))
  file.close()

  photopath = sys.path[0]
  for album in picasa.myalbums:
    myphotos = album['photos']
    myphotos_title = album['title']
    myphotos_url = album['url']
    photosfiller={'myphotos':album['photos'],'title':myphotos_title,'photo_css_class':'class="active"','video_css_class':''}
    t = Template(file="templatePhoto.tmpl",searchList=[globalfiller,photosfiller])
    file = open("%s/%s" % (photopath, myphotos_url), 'w')
    file.write(str(t))
    file.close()

  #Write Videos
  logging.info('main: == Création Vidéos ==')
  videosfiller={'myalbums':video.myvideos,'photo_css_class':'','video_css_class':'class="active"'}
  t = Template(file="template.tmpl",searchList=[globalfiller,videosfiller])
  file = open("videos.html", 'w')
  file.write(str(t))
  file.close()

  logging.info('main: == Fin traitement ==')


  
