paper.install(window);
var maskl;
var maskm;
var pathl;
var pathr;
var pathm;
	
//current fake mouse event
var currentEvent;

//last movement vector
var lastDelta;

//current drawing path
var drawing;

//contains each drawn text as group
var drawnGroups = [];

//Group of current drawing paths
var drawnPaths;

//Brush consists of X points
var points = 15;
//Brush point distance
var length = 8;

//Min and Max Brush Width
var widthMin = 7;
var widthMax = 12;
//writing speed
var speed = 16;

//scales the letters 
var scalefactor = 1.5;

var debug = false;

//strings to write
var names = [
	'hello',
	'world'
];
names.reverse();

window.onload = function() {
	// Setup paper.js
	paper.setup('myCanvas');

	lastDelta = new Point(0,0);

	maskl = new Path();
	maskm = new Path();
	if(debug){
		maskm.strokeColor = 'red';
		maskl.strokeColor = 'red';
	}

	//initialize brush (aka mask)
	var start = view.center.divide([10, 1]);
	for (var i = 0; i < points; i++){
		maskm.add(start.add(new Point(i * length, 0)));
		maskl.add(start.add(new Point(i * length, 0)));
	}
		
	drawing = new Path();
	if(debug){
		drawing.fillColor = 'black';
	}else{
		drawing.fillColor = 'white';
		document.body.style.backgroundColor = 'black';
	}

	drawnPaths = new Group();
	var lines = buildLines(names.pop());
	lines.reverse();

	//current line to draw
	var currentLine = lines.pop();
	//current position on line
	var currentpos = 0;
	//finishing flag for whole drawing
	var finished = false;
	//initialize fake mouse event 
	currentEvent = {
		delta: new Point(0,0),
		middlePoint: currentLine.firstSegment.point,
		point: currentLine.firstSegment.point
	};
	
	//Drawing Loop
	paper.view.onFrame = function(event) {
		if(!finished){
			
			//if start of a line that is drawn
			if(currentpos == 0 && currentLine.drawing){
				startPath(currentEvent);
			}
			
			//updating fake mouse event
			updateEvent(currentLine.getPointAt(currentpos));
			
			//draw or only move fake mouse
			if(currentLine.drawing){
				drag(currentEvent);
			}else{
				move(currentEvent);
			}
			
			//update position on line
			currentpos += speed;
			
			//if end of line is reached
			if(currentpos >= currentLine.length){
				
				//move to endpoint of line
				currentpos = currentLine.length-1;
				updateEvent(currentLine.getPointAt(currentpos));
				if(currentLine.drawing){
					drag(currentEvent);
				}else{
					move(currentEvent);
				}
			
				//end drawing
				if(currentLine.drawing){
					endPath(currentEvent);
				}
				
				//reset variables for next line
				currentLine = lines.pop();
				currentpos = 0;
				
				//last line in text reached
				if(typeof currentLine === 'undefined'){
					let nextName = names.pop();
					drawnGroups.push(drawnPaths);
					drawnPaths = new Group();
					
					//last text reached
					if(typeof nextName === 'undefined'){
						finished = true;
						
					//nect line
					}else{
						lines = buildLines(nextName);
						lines.reverse();
						currentLine = lines.pop();
						currentpos = 0;
					}
					
				}
			}
			
		}
		
		//fade out drawn texts
		drawnGroups.forEach(function(group){
			group.opacity *= 0.999;
		})
	}
	
}

//generate lines between letters
function buildLines(text){
	let pos = new Point(300,300);
	var linegroup = new Group();
	var lines = [];
	
	//iterate through letters in text
	for (var i = 0; i < text.length; i++) {
		
		let letter = text.charAt(i);
		//just move to right if space
		if(letter == ' '){
			pos = pos.add([100,0]);
			continue;
		}
		//get lines of letter
		let nr = getRandomInt(0,font[letter].length-1);
		let group = new Group();
		group.importJSON(font[letter][nr]);
		group.scale(scalefactor);
		//align letter lines
		group.bounds.leftCenter = pos;
		pos = group.bounds.rightCenter.add([getRandomInt(10,50), 0]);
		
		//clone lines into a group
		group.children.forEach(function(line, idx){
			line.selected = false;
			line.strokeColor = null;
			if(debug){
				line.strokeColor = 'green';
			}
			linegroup.addChild(line.clone());
			
		});
		group.remove();
	}
	
	//choose position for text
	linegroup.position = Point.random().multiply(project.view.bounds.size.subtract(linegroup.bounds.size));
	linegroup.position = linegroup.position.add(linegroup.bounds.size.divide(2));
	linegroup.rotate(getRandomInt(0,20)-10);
	if(drawnGroups.length>0){
		while(linegroup.bounds.intersects(drawnGroups[drawnGroups.length-1].bounds)){
			linegroup.position = Point.random().multiply(project.view.bounds.size.subtract(linegroup.bounds.size));
			linegroup.position = linegroup.position.add(linegroup.bounds.size.divide(2));
		}
	}
	
	//calculate paths between letters
	linegroup.children.forEach(function(line, idx){
		let between = new Path();
				
		let t2 = line.getPointAt(0).subtract(line.getPointAt(50));
		if(lines.length>0){
			between.add(new Segment(lines[lines.length-1].lastSegment.point, null, null));
		}else{
			between.add(line.position.subtract([200,200]));
		}
		between.add(new Segment(line.firstSegment.point, t2.normalize(getRandomInt(200,450)), null));
		if(debug){
			between.strokeColor = 'red';
			between.strokeWidth = 5;
		}
		lines.push(between);
			
		line.drawing = true;
		lines.push(line);
			
	});
	return lines;
}

//get random Int including min and max
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//update fake mouse event
function updateEvent(point){
    var newEvent = {
        delta: point.subtract(currentEvent.point),
        middlePoint: currentEvent.point.add(point.subtract(currentEvent.point).divide(2)),
        point: point
    }
    currentEvent = newEvent;
}

function newMask(event){
    var vec = event.delta.multiply(-1);
    var d = vec.rotate(90);
    maskm = new Path();
    maskl = new Path();
	if(debug){
		maskm.strokeColor = 'lightgrey';
		maskl.strokeColor = 'lightgrey';
	}
    var start = event.point;
    for (var i = 0; i < points; i++){
    	maskm.add(start.add(vec.normalize(length*i)).subtract(d));
    	maskl.add(start.add(vec.normalize(length*i)).add(d));
    }

    drawnPaths.addChild(drawing.clone());
    drawing.remove();
    drawing = new Path();
    if(debug){
		drawing.fillColor = 'black';
	}else{
		drawing.fillColor = 'white';
	}
}

function newPaths(event){
    pathl = new Path();
	pathl.add(event.point);
	
	pathr = new Path();
	pathr.add(event.point);
	
	pathm = new Path();
	pathm.add(event.point);
}

function endPath(event){
    newMask({point:event.point, delta:lastDelta});
}

function startPath(event) {
    newPaths(event);
    //maskm.opacity = 0;
    //maskl.opacity = 0;
}

//move brush without drawing
function move(event){
    maskm.firstSegment.point = event.point.add(event.delta.rotate(90));
	for (var i = 0; i < points - 1; i++) {
		var segment = maskm.segments[i];
		var nextSegment = segment.next;
		var vector = segment.point.subtract(nextSegment.point);
		vector.length = length;
		nextSegment.point = segment.point.subtract(vector);
	}
	
	maskl.firstSegment.point = event.point.add(event.delta.rotate(-90));
	for (var i = 0; i < points - 1; i++) {
		var segment = maskl.segments[i];
		var nextSegment = segment.next;
		var vector = segment.point.subtract(nextSegment.point);
		vector.length = length;
		nextSegment.point = segment.point.subtract(vector);
	}
}

//move brush and draw
function drag(event) {
    var step = event.delta.normalize(getRandomInt(widthMin, widthMax));
	step.angle += 90;
    
    if(lastDelta.getAngle(event.delta) > 170){
        newMask(event);
        newPaths(event);
    }
    
    //move brush
    maskm.firstSegment.point = event.point.add(step);
    maskm.insertSegment(points,maskm.segments[points-1].point);
	for (var i = 0; i < points - 1; i++) {
		var segment = maskm.segments[i];
		var nextSegment = segment.next;
		var vector = segment.point.subtract(nextSegment.point);
		vector.length = length;
		nextSegment.point = segment.point.subtract(vector);
	}
	
	maskl.firstSegment.point = event.point.subtract(step);
    maskl.insertSegment(points,maskl.segments[points-1].point);
	for (var i = 0; i < points - 1; i++) {
		var segment = maskl.segments[i];
		var nextSegment = segment.next;
		var vector = segment.point.subtract(nextSegment.point);
		vector.length = length;
		nextSegment.point = segment.point.subtract(vector);
	}

	
	var top = event.middlePoint.add(step);
	var bottom = event.middlePoint.subtract(step);

	pathl.add(top);
	pathr.add(bottom);
	pathm.add(event.middlePoint);

	//add new points to drawing
	for(var i = pathl.segments.length-1; i>pathl.segments.length-60 && i>0; i--){
	    var p = pathl.segments[i].point;
	    var m = pathm.segments[i].point;
	    var near = maskm.getNearestPoint(p);
	    
	    var inner = p.subtract(m);
	    var outer = near.subtract(m);
	    var rest = outer.subtract(inner);
	    
	    if(outer.length > inner.length && rest.length < outer.length){
	        pathl.segments[i].point = near;
	    }
	}
	
	for(var i = pathr.segments.length-1; i>pathr.segments.length-60 && i>0; i--){
	    var p = pathr.segments[i].point;
	    var m = pathm.segments[i].point;
	    var near = maskl.getNearestPoint(p);
	    
	    var inner = p.subtract(m);
	    var outer = near.subtract(m);
	    var rest = outer.subtract(inner);
	    
	    if(outer.length > inner.length && rest.length < outer.length){
	        pathr.segments[i].point = near;
	    }
	}
	
	pathr.reverse();
	drawing.segments = pathl.segments.concat(pathr.segments);
	drawing.smooth({type: 'geometric'});
	pathr.reverse();
    
    
	lastDelta = event.delta;
	
}

