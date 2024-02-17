# Use official ubuntu 18.04 as parent image
FROM ubuntu:18.04

RUN apt-get update -y

RUN apt-get upgrade -y

RUN apt-get dist-upgrade -y

RUN mkdir adflush

COPY ./ ./adflush

WORKDIR adflush

RUN apt-get install -y openjdk-11-jdk-headless nodejs nodejs-dev node-gyp npm libssl1.0-dev build-essential autoconf python3.7-dev python3-setuptools zlib1g-dev libffi-dev

CMD ["/bin/bash"]

# apt-get install libbz2-dev liblzma-dev lzma zlib1g-dev

# npm init -y

# npm install fs acorn-loose

# tar -xvzf Python-3.7.17.tgz

# cd Python-3.7.17

# ./configure

# make altinstall

# cd /adflush

# python3.7 -m venv adflushenv

# source adflushenv/bin/activate

# python -m pip install --upgrade pip setuptools

# pip install requests tabulate future

# pip install -r requirements.txt