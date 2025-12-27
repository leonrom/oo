#!/bin/bash
cd ../
cat com.js \
    com/CConsole.js com/CEncode.js com/CApi.js com/CParams.js com/CPops.js com/TagsRef.js com/IniScripts.js \
  > ./cc/ljs/o7com!.js        2> ./cc/log.txt

cat snd/AO5snd.js snd/Prep.js snd/Imgs.js snd.js \
  > ./cc/ljs/o7snd!.js        2>>./cc/log.txt
  
cat shp/AO5shp.js shp/PO5shp.js shp/PBases.js shp/DoInit.js shp/PBases.js shp/Frames.js shp/DoChgs.js shp.js \
  > ./cc/ljs\o7shp!.js        2>>./cc/log.txt

cat dbg/Ccss.js dbg/Events.js dbg/Logs.js dbg/Pos.js dbg/Ccss.js dbg/Utils.js dbg.js \
  > ./cc/ljs\o7dbg!.js        2>>./cc/log.txt

cat inc.js tab.js pop.js mnu.js \
   > ./cc/ljs\o7add!.js       2>>./cc/log.txt

cat ref.js  \
   > ./cc/ljs\o7ref!.js       2>>./cc/log.txt

cd ./cc/ljs

cat o7com!.js o7add!.js o7ref!.js o7snd!.js o7shp!.js \
   > o7.js           2>>../cc/log.txt  

@REM cat ../css/olga5-a.css  > ../../tr/css.o7/olga5-a.css
@REM cat js/inc.js  > ../../tr/js/inc.js
