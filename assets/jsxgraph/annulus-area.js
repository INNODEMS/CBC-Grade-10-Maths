
const brdGeometry = JXG.JSXGraph.initBoard('box_annulus_geometry', {
    boundingbox: [-12, 10, 12, -14],
    axis: false,
    grid: false,
    showNavigation: false,
    showCopyright: false,
    keepaspectratio: true
});

brdGeometry.create('text',[-10,9,'Outer Radius (R)'],{fontSize:13,fontWeight:'bold',fixed:true, strokeColor:'#00bcd4', fillColor:'#00bcd4'});

const sR = brdGeometry.create('slider', [[-10,7.5],[-3,7.5],[1,5,7]], {
    name:'R',
    fillColor:'#00bcd4',
    strokeColor:'#00bcd4'
});

brdGeometry.create('text',[2,9,'Inner Radius (r)'],{fontSize:13,fontWeight:'bold',fixed:true, strokeColor:'#e74c3c', fillColor:'#e74c3c'});

const sr = brdGeometry.create('slider', [[2,7.5],[9,7.5],[0,2,6.5]], {
    name:'r',
    fillColor:'#e74c3c',
    strokeColor:'#e74c3c'
});



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

brdGeometry.create('text',[-10,-10,function(){

const R=sR.Value();
const r=Math.min(sr.Value(),sR.Value()-0.5);

const areaOuter=(Math.PI*R*R).toFixed(2);
const areaInner=(Math.PI*r*r).toFixed(2);
const annulusArea=(areaOuter-areaInner).toFixed(2);

return "<div style='background:white;padding:10px;border:2px solid #2c3e50;border-radius:8px;width:220px;font-family:sans-serif;'>"+
"<b style='font-size:15px;'>Calculation:</b><hr>"+
"Area<sub>Outer</sub>: π("+R.toFixed(2)+")² ≈ "+areaOuter+"<br>"+
"Area<sub>Inner</sub>: π("+r.toFixed(2)+")² ≈ "+areaInner+"<br><br>"+
"<b style='color:#00838f;'>Annulus Area:</b><br>"+
"A = "+areaOuter+" − "+areaInner+"<br>"+
"<b>A ≈ "+annulusArea+" units²</b></div>";

}],{fontSize:14,fixed:true, xAnchor:'middle', yAnchor:'middle'});