var s="<kml For anyone hitting this issue when clustering markers, it is a result of using third-party library of MarkerWithLabel```MarkerLabel_.prototype.onRemove = function () {var i;this.labelDiv_.parentNode.removeChild(this.labelDiv_);this.eventDiv_.parentNode.removeChild(this.eventDiv_);// Remove event listenersfor (i = 0; i < this.listeners_.length; i++) {google.maps.event.removeListener(this.listeners_[i]);}};```kml> After,<the> code";
var stringWithoutComments = s.replace(/(`[^*]*`)|(```[^*]*```)|(''[^*]*'')|(<kml[^*]*kml>)|(,)|(<[^*]*>)/g, ' ');
console.log(stringWithoutComments);