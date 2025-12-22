cd ..\

type com.js ^
     com\CConsole.js com\CEncode.js com\CApi.js com\CParams.js ^
     com\TagsRef.js com\IniScripts.js ^
   > ./cc/wjs\o7com!.js  2> cc\log.txt

type shp\AO5shp.js shp\PO5shp.js shp\DoInit.js shp/PBases.js 5shp\Frames.js shp\DoChgs.js ^
     shp.js ^
   > ./cc/wjs\o7shp!.js  2>>cc\log.txt

type snd\cAO5.js snd\Prep.js snd\Imgs.js ^
     snd.js ^
   > ./cc/wjs\o7snd!.js  2>>cc\log.txt

type dbg/events.js dbg/logs.js dbg/pos.js ^
     dbg.js ^
   > ./cc/wjs\o7dbg!.js   2>>cc\log.txt

cd ./cc/wjs
type o7com!.js ^
     o7ref.js o7tab.js o7snd!.js o7shp!.js o7pop.js o7mnu.js ^     
   > o7.js 2>>..\cc\log.txt




