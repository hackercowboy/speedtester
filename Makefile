all: build push

build:
	docker build -t hackercowboy/speedtester .

push:
	docker push hackercowboy/speedtester