
const brdGeometry = JXG.JSXGraph.initBoard('box_annulus_geometry', {
    boundingbox: [-12, 12, 18, -12],
    axis: false,
    grid: false,
    showNavigation: false,
    showCopyright: false,
    keepaspectratio: true
});

const brdPanel = JXG.JSXGraph.initBoard('box_annulus_panel', {
    boundingbox: [0, 6, 10, -1],
    axis: false,
    grid: false,
    showNavigation: false,
    showCopyright: false
});

brdGeometry.addChild(brdPanel);

const sR = brdGeometry.create('slider', [[10,8],[15,8],[1,8,10]], {
    name:'R',
    snapWidth:0.5,
    fillColor:'#00bcd4',
    strokeColor:'#00bcd4'
});


brdGeometry.create('text',[10,9,'Outer Radius (R)'],{fontSize:13,fontWeight:'bold',fixed:true});

const sr = brdGeometry.create('slider', [[10,5],[15,5],[0,4,10]], {
    name:'r',
    snapWidth:0.5,
    fillColor:'#7f8c8d',
    strokeColor:'#7f8c8d'
});

brdGeometry.create('text',[10,6,'Inner Radius (r)'],{fontSize:13,fontWeight:'bold',fixed:true});

const center = brdGeometry.create('point',[0,0],{name:'C',fixed:true,size:3});

const outerCircle = brdGeometry.create('circle',[center,()=>sR.Value()],{
strokeWidth:2,
strokeColor:'#2c3e50',
fillColor:'#e0f7fa',
fillOpacity:1
});
const innerCircle = brdGeometry.create('circle',
[center,()=>Math.min(sr.Value(),sR.Value()-0.5)],
{
strokeWidth:2,
strokeColor:'#2c3e50',
dash:2,
fillColor:'#ffffff',
fillOpacity:1
});

brdGeometry.create('segment',[center,[()=>sR.Value(),0]],{
strokeColor:'#00bcd4',
strokeWidth:3
});

brdGeometry.create('segment',[center,[0,()=>-Math.min(sr.Value(),sR.Value()-0.5)]],{
strokeColor:'#e74c3c',
strokeWidth:3
});

brdPanel.create('text',[1,2.5,function(){

const R=sR.Value();
const r=Math.min(sr.Value(),sR.Value()-0.5);

const areaOuter=(Math.PI*R*R).toFixed(2);
const areaInner=(Math.PI*r*r).toFixed(2);
const annulusArea=(areaOuter-areaInner).toFixed(2);

return "<div style='background:white;padding:15px;border:2px solid #2c3e50;border-radius:8px;width:240px;font-family:sans-serif;'>"+
"<b style='font-size:16px;'>Calculation:</b><hr>"+
"Area<sub>Outer</sub>: π("+R+")² ≈ "+areaOuter+"<br>"+
"Area<sub>Inner</sub>: π("+r+")² ≈ "+areaInner+"<br><br>"+
"<b style='color:#00838f;'>Annulus Area:</b><br>"+
"A = "+areaOuter+" − "+areaInner+"<br>"+
"<b>A ≈ "+annulusArea+" units²</b></div>";

}],{fontSize:14,fixed:true});