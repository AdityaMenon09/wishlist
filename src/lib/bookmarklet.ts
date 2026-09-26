/**
 * The bookmarklet runs inside the product page, in the user's own browser, so store bot
 * checks never see it. It collects a compact snapshot (head tags, JSON-LD, key Amazon blocks,
 * spec tables, plus hints measured from the rendered page such as the most prominent ₹ price)
 * and opens WishList's /capture page with the snapshot gzipped into the URL fragment.
 * The fragment never reaches any server log; /capture reads it client-side.
 *
 * Kept as a raw string (not a compiled function) so the build can't inject helpers into it,
 * and String.raw so backslashes reach the browser exactly as written.
 * No `//` comments inside: the source is collapsed onto one line.
 */
const SOURCE = String.raw`(function(){
var APP="__ORIGIN__";
var w=window.open("about:blank","_blank");
try{
var out=[],size=0,LIM=350000;
function add(h){if(h&&h.length<60000&&size+h.length<LIM){out.push(h);size+=h.length;}}
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");}
document.querySelectorAll('title,meta,link[rel="canonical"],script[type="application/ld+json"]').forEach(function(e){add(e.outerHTML);});
["#productTitle","#bylineInfo","#corePriceDisplay_desktop_feature_div","#corePrice_feature_div","#corePrice_desktop","#apex_desktop","#priceblock_ourprice","#priceblock_dealprice","#landingImage","#feature-bullets","#productOverview_feature_div","#productDetails_techSpec_section_1","#productDetails_detailBullets_sections1","#detailBullets_feature_div","#wayfinding-breadcrumbs_feature_div","#availability","h1"].forEach(function(s){var e=document.querySelector(s);if(e)add(e.outerHTML);});
var st=document.getElementById("is_script");if(st){var tx=st.textContent||"",pp=tx.match(/"ppd":\{[^}]*\}/),sp=tx.match(/"label_1":\{"value":\{"text":\["(?:[^"\\]|\\.)*"\]\}\},"label_0":\{"value":\{"text":"(?:[^"\\]|\\.)*"\}\}/g)||[];add('<script type="text/plain" id="wl-state">'+(pp?pp[0]:"")+" "+sp.slice(0,80).join(" ").replace(/</g,"\\u003c")+'</script>');}
document.querySelectorAll("[itemprop]").forEach(function(e){if(e.outerHTML.length<3000)add(e.outerHTML);});
document.querySelectorAll("table").forEach(function(t){add(t.outerHTML.replace(/\s(class|style|data-[\w-]+)="[^"]*"/g,""));});
var RE=/^(₹|Rs\.?|INR)\s?[\d,]+(\.\d{1,2})?$/,best=null,bs=0,mrp=null,img=null,ia=0,y=window.scrollY,all=document.body.getElementsByTagName("*");
for(var i=0;i<all.length&&i<40000;i++){var el=all[i];
if(el.tagName==="IMG"){var r=el.getBoundingClientRect();var a=r.width*r.height;if(r.top+y<1400&&a>ia&&r.width>150){ia=a;img=el.currentSrc||el.src;}continue;}
if(el.children.length>2)continue;var t=(el.textContent||"").trim();if(t.length>24||!RE.test(t))continue;
var rc=el.getBoundingClientRect();if(!rc.width||rc.top+y>1600)continue;
var cs=getComputedStyle(el),ps=el.parentElement?getComputedStyle(el.parentElement):cs;
if(cs.textDecorationLine.indexOf("line-through")>=0||ps.textDecorationLine.indexOf("line-through")>=0){if(!mrp)mrp=t;continue;}
var fs=parseFloat(cs.fontSize);if(fs>bs){bs=fs;best=t;}}
var h1=document.querySelector("h1");
add('<meta name="wl:price-hint" content="'+esc(best)+'">');
add('<meta name="wl:mrp-hint" content="'+esc(mrp)+'">');
add('<meta name="wl:image-hint" content="'+esc(img)+'">');
add('<meta name="wl:title-hint" content="'+esc(h1?h1.textContent.trim():document.title)+'">');
var json=JSON.stringify({u:location.href,h:"<html><body>"+out.join("\n")+"</body></html>"});
function b64(bytes){var s="";for(var j=0;j<bytes.length;j+=32768)s+=String.fromCharCode.apply(null,bytes.subarray(j,j+32768));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
function go(k,d){var url=APP+"/capture#"+k+"="+d;if(w)w.location.href=url;else location.href=url;}
if(window.CompressionStream){new Response(new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer().then(function(b){go("g",b64(new Uint8Array(b)));});}
else{go("p",b64(new TextEncoder().encode(json)));}
}catch(e){if(w)w.close();alert("WishList couldn't read this page: "+e.message);}
})();`;

export function bookmarkletHref(origin: string): string {
  const code = SOURCE.replace("__ORIGIN__", origin)
    .split("\n")
    .map((l) => l.trim())
    .join("");
  return "javascript:" + encodeURIComponent(code);
}
