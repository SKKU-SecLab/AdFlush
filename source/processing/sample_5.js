this.gbar_=this.gbar_||{};(function(_){var window=this;
try{
_.Bd=function(a,b,c){if(!a.j)if(c instanceof Array)for(var d of c)_.Bd(a,b,d);else{d=(0,_.y)(a.A,a,b);const e=a.s+c;a.s++;b.dataset.eqid=e;a.B[e]=d;b&&b.addEventListener?b.addEventListener(c,d,!1):b&&b.attachEvent?b.attachEvent("on"+c,d):a.o.log(Error("u`"+b))}};
}catch(e){_._DumpException(e)}
try{
_.Cd=function(){if(!_.q.addEventListener||!Object.defineProperty)return!1;var a=!1,b=Object.defineProperty({},"passive",{get:function(){a=!0}});try{const c=()=>{};_.q.addEventListener("test",c,b);_.q.removeEventListener("test",c,b)}catch(c){}return a}();
}catch(e){_._DumpException(e)}
try{
var Dd=document.querySelector(".gb_l .gb_d"),Ed=document.querySelector("#gb.gb_Uc");Dd&&!Ed&&_.Bd(_.nd,Dd,"click");
}catch(e){_._DumpException(e)}
try{
_.qh=function(a){const b=[];let c=0;for(const d in a)b[c++]=a[d];return b};_.rh=function(a){if(a.o)return a.o;for(const b in a.i)if(a.i[b].qa()&&a.i[b].B())return a.i[b];return null};_.sh=function(a,b){a.i[b.J()]=b};var th=new class extends _.vc{constructor(){var a=_.xc;super();this.B=a;this.o=null;this.j={};this.A={};this.i={};this.s=null}v(a){this.i[a]&&(_.rh(this)&&_.rh(this).J()==a||this.i[a].O(!0))}Wa(a){this.s=a;for(const b in this.i)this.i[b].qa()&&this.i[b].Wa(a)}tc(a){return a in this.i?this.i[a]:null}};_.qd("dd",th);
}catch(e){_._DumpException(e)}
try{
_.aj=function(a,b){return _.L(a,36,b)};
}catch(e){_._DumpException(e)}
try{
var bj=document.querySelector(".gb_b .gb_d"),cj=document.querySelector("#gb.gb_Uc");bj&&!cj&&_.Bd(_.nd,bj,"click");
}catch(e){_._DumpException(e)}
})(this.gbar_);
// Google Inc.
this.gbar_=this.gbar_||{};(function(_){var window=this;
try{
var Gd,Jd;_.Fd=function(a){const b=a.length;if(0<b){const c=Array(b);for(let d=0;d<b;d++)c[d]=a[d];return c}return[]};Gd=function(a){return a};_.Hd=function(a){var b=null,c=_.q.trustedTypes;if(!c||!c.createPolicy)return b;try{b=c.createPolicy(a,{createHTML:Gd,createScript:Gd,createScriptURL:Gd})}catch(d){_.q.console&&_.q.console.error(d.message)}return b};_.Id=function(a,b){return 0==a.lastIndexOf(b,0)};_.Kd=function(){void 0===Jd&&(Jd=_.Hd("ogb-qtm#html"));return Jd};try{(new self.OffscreenCanvas(0,0)).getContext("2d")}catch(a){};_.Ld={};_.Md=class{constructor(a){this.i=a;this.Bb=!0}nb(){return this.i}toString(){return this.i.toString()}};_.Nd=new _.Md("",_.Ld);_.Od=RegExp("^[-+,.\"'%_!#/ a-zA-Z0-9\\[\\]]+$");_.Pd=RegExp("\\b(url\\([ \t\n]*)('[ -&(-\\[\\]-~]*'|\"[ !#-\\[\\]-~]*\"|[!#-&*-\\[\\]-~]*)([ \t\n]*\\))","g");_.Qd=RegExp("\\b(calc|cubic-bezier|fit-content|hsl|hsla|linear-gradient|matrix|minmax|radial-gradient|repeat|rgb|rgba|(rotate|scale|translate)(X|Y|Z|3d)?|steps|var)\\([-+*/0-9a-zA-Z.%#\\[\\], ]+\\)","g");var Rd;Rd={};_.Td=function(a){return a instanceof _.Sd&&a.constructor===_.Sd?a.i:"type_error:SafeHtml"};_.Ud=function(a){const b=_.Kd();a=b?b.createHTML(a):a;return new _.Sd(a,Rd)};_.Sd=class{constructor(a){this.i=a;this.Bb=!0}nb(){return this.i.toString()}toString(){return this.i.toString()}};_.Vd=new _.Sd(_.q.trustedTypes&&_.q.trustedTypes.emptyHTML||"",Rd);_.Wd=_.Ud("<br>");var Yd;_.Xd=function(a){let b=!1,c;return function(){b||(c=a(),b=!0);return c}}(function(){var a=document.createElement("div"),b=document.createElement("div");b.appendChild(document.createElement("div"));a.appendChild(b);b=a.firstChild.firstChild;a.innerHTML=_.Td(_.Vd);return!b.parentElement});Yd=/^[\w+/_-]+[=]{0,2}$/;
_.Zd=function(a){a=(a||_.q).document;return a.querySelector?(a=a.querySelector('style[nonce],link[rel="stylesheet"][nonce]'))&&(a=a.nonce||a.getAttribute("nonce"))&&Yd.test(a)?a:"":""};_.$d=function(a,b){this.width=a;this.height=b};_.m=_.$d.prototype;_.m.aspectRatio=function(){return this.width/this.height};_.m.Hb=function(){return!(this.width*this.height)};_.m.ceil=function(){this.width=Math.ceil(this.width);this.height=Math.ceil(this.height);return this};_.m.floor=function(){this.width=Math.floor(this.width);this.height=Math.floor(this.height);return this};_.m.round=function(){this.width=Math.round(this.width);this.height=Math.round(this.height);return this};_.Q=function(a,b){var c=b||document;if(c.getElementsByClassName)a=c.getElementsByClassName(a)[0];else{c=document;var d=b||c;a=d.querySelectorAll&&d.querySelector&&a?d.querySelector(a?"."+a:""):_.ae(c,a,b)[0]||null}return a||null};
_.ae=function(a,b,c){var d;a=c||a;if(a.querySelectorAll&&a.querySelector&&b)return a.querySelectorAll(b?"."+b:"");if(b&&a.getElementsByClassName){var e=a.getElementsByClassName(b);return e}e=a.getElementsByTagName("*");if(b){var f={};for(c=d=0;a=e[c];c++){var g=a.className;"function"==typeof g.split&&_.ta(g.split(/\s+/),b)&&(f[d++]=a)}f.length=d;return f}return e};_.ce=function(a){return _.be(document,a)};
_.be=function(a,b){b=String(b);"application/xhtml+xml"===a.contentType&&(b=b.toLowerCase());return a.createElement(b)};_.de=function(a){for(var b;b=a.firstChild;)a.removeChild(b)};_.ee=function(a){return 9==a.nodeType?a:a.ownerDocument||a.document};
}catch(e){_._DumpException(e)}
try{
var Ae,Ce;_.ve=function(a){if(null==a)return a;if("string"===typeof a){if(!a)return;a=+a}if("number"===typeof a)return a};_.we=function(a,b){var c=Array.prototype.slice.call(arguments,1);return function(){var d=c.slice();d.push.apply(d,arguments);return a.apply(this,d)}};_.xe=function(a,b){return _.ve(_.D(a,b))};_.ye=function(a,b){if(void 0!==a.ua||void 0!==a.i)throw Error("x");a.i=b;_.dd(a)};_.ze=class extends _.P{constructor(a){super(a)}};Ae=class extends _.rd{};
_.Be=function(a,b){if(b in a.i)return a.i[b];throw new Ae;};Ce=0;_.De=function(a){return Object.prototype.hasOwnProperty.call(a,_.nb)&&a[_.nb]||(a[_.nb]=++Ce)};
_.Ee=function(a){if(a instanceof _.Dc)return a;a="object"==typeof a&&a.Bb?a.nb():String(a);a:{var b=a;if(_.Kc){try{var c=new URL(b)}catch(d){b="https:";break a}b=c.protocol}else b:{c=document.createElement("a");try{c.href=b}catch(d){b=void 0;break b}b=c.protocol;b=":"===b||""===b?"https:":b}}"javascript:"===b&&(a="about:invalid#zClosurez");return _.Hc(a)};_.Fe=function(a){return _.Be(_.od.i(),a)};
}catch(e){_._DumpException(e)}
try{
/*

 SPDX-License-Identifier: Apache-2.0
*/
var hj,ij;hj=function(a){return new _.gj(b=>b.substr(0,a.length+1).toLowerCase()===a+":")};ij={};_.jj=class{constructor(a){this.i=a}toString(){return this.i+""}};_.jj.prototype.Bb=!0;_.jj.prototype.nb=function(){return this.i.toString()};_.lj=function(a){return _.kj(a).toString()};_.kj=function(a){return a instanceof _.jj&&a.constructor===_.jj?a.i:"type_error:TrustedResourceUrl"};_.mj=function(a){const b=_.Kd();a=b?b.createScriptURL(a):a;return new _.jj(a,ij)};_.nj="function"===typeof URL;_.gj=class{constructor(a){this.Lg=a}};_.oj=[hj("data"),hj("http"),hj("https"),hj("mailto"),hj("ftp"),new _.gj(a=>/^[^:]*([/?#]|$)/.test(a))];
}catch(e){_._DumpException(e)}
try{
_.pj=class extends _.P{constructor(a){super(a)}};
}catch(e){_._DumpException(e)}
try{
_.qj=function(a,b,c){a.rel=c;-1!=c.toLowerCase().indexOf("stylesheet")?(a.href=_.lj(b),(b=_.Zd(a.ownerDocument&&a.ownerDocument.defaultView))&&a.setAttribute("nonce",b)):a.href=b instanceof _.jj?_.lj(b):b instanceof _.Dc?_.Ec(b):_.Ec(_.Ee(b))};
}catch(e){_._DumpException(e)}
try{
_.rj=function(a){var b;let c;const d=null==(c=(b=(a.ownerDocument&&a.ownerDocument.defaultView||window).document).querySelector)?void 0:c.call(b,"script[nonce]");(b=d?d.nonce||d.getAttribute("nonce")||"":"")&&a.setAttribute("nonce",b)};_.sj=function(a,b){return(b||document).getElementsByTagName(String(a))};
}catch(e){_._DumpException(e)}
try{
var uj=function(a,b,c){a<b?tj(a+1,b):_.xc.log(Error("X`"+a+"`"+b),{url:c})},tj=function(a,b){if(vj){const c=_.ce("SCRIPT");c.async=!0;c.type="text/javascript";c.charset="UTF-8";c.src=_.kj(vj);_.rj(c);c.onerror=_.we(uj,a,b,c.src);_.sj("HEAD")[0].appendChild(c)}},wj=class extends _.P{constructor(a){super(a)}};var xj=_.G(_.id,wj,17)||new wj,yj,vj=(yj=_.G(xj,_.pj,1))?_.mj(_.I(yj,4)||""):null,zj,Aj=(zj=_.G(xj,_.pj,2))?_.mj(_.I(zj,4)||""):null,Bj=function(){tj(1,2);if(Aj){const a=_.ce("LINK");a.setAttribute("type","text/css");_.qj(a,Aj,"stylesheet");let b=_.Zd();b&&a.setAttribute("nonce",b);_.sj("HEAD")[0].appendChild(a)}};(function(){const a=_.jd();if(_.F(a,18))Bj();else{const b=_.xe(a,19)||0;window.addEventListener("load",()=>{window.setTimeout(Bj,b)})}})();
}catch(e){_._DumpException(e)}
})(this.gbar_);
// Google Inc.
