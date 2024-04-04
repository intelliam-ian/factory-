# Make rules for building Docker images

ifndef .acs.docker.mk
.acs.docker.mk=1

version?=${git.tag}
registry?=ghcr.io/amrc-factoryplus
suffix?=

tag=${registry}/${repo}:${version}${suffix}

docker.src_dir!=	git rev-parse --show-prefix
docker.src_sha!=	git rev-parse HEAD:'${docker.src_dir}'

build_args+=	--build-arg revision='${git.tag} (${git.sha})'
build_args+=	--build-arg src_sha='${docker.src_sha}'

docker.img_label?=	uk.co.amrc.app.factoryplus.src-sha
docker.img_exist!=	docker image ls \
	-f label=${docker.img_label}=${docker.src_sha} \
	--format "{{.ID}}"

.PHONY: build docker.build docker.retag push run

all: build push

build: git.prepare
	@: build

ifdef git.allow_dirty
build: docker.build
else
  ifdef docker.img_exist
build: docker.retag
  else
build: docker.build
  endif
endif

docker.build:
	: src: [${docker.src_sha}]
	: exist: [${docker.img_exist}]
	docker build -t "${tag}" ${build_args} .

docker.retag:
	docker tag "${docker.img_exist}" "${tag}"

push:
	docker push "${tag}"

run:
	docker run -ti --rm "${tag}" /bin/sh

include ${mk}/acs.git.mk
include ${mk}/acs.k8s.mk

endif
