#!/bin/bash

# Step 1: Determine the current git branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "Current Git branch: $current_branch"

# Step 2: Fetch the semantic version using GitVersion
echo "Determining version using GitVersion..."
version=$(gitversion /output json | jq -r '.SemVer')

if [ -z "$version" ]; then
  echo "Failed to determine the version."
  read -p "Press any key to continue..."
  exit
fi

echo "Version determined: $version"

# Step 3: Build the Docker image
echo "Building Docker image..."
docker buildx build --platform=linux/amd64 -t ev-simulator:$version .

if [ $? -ne 0 ]; then
  echo "Failed to build Docker image."
  read -p "Press any key to continue..."
  exit
fi

echo "Docker image built with tag: ev-simulator:$version"

# Step 4: If on master branch, tag the git repository
if [ "$current_branch" == "master" ]; then
  echo "On master branch, tagging the repository with version $version..."
  
  # Check if the tag already exists
  if git rev-parse "v$version" >/dev/null 2>&1; then
    echo "Tag v$version already exists."
  else
    # Create and push the tag
    git tag -a "v$version" -m "Release version $version"
    git push origin "v$version"
    
    if [ $? -ne 0 ]; then
      echo "Failed to push git tag."
      read -p "Press any key to continue..."
      exit
    fi
    
    echo "Git repository tagged with v$version."
  fi
else
  echo "Not on master branch, skipping git tagging."
fi


# Check if values.yaml exists, if not, create it from sample.yaml
if [ ! -f values.yaml ]; then
  cp sample.yaml values.yaml
  echo "Created values.yaml from sample.yaml"
fi
case "$1" in
  "shell")
    docker run -it -p 8080:8080 -v $(pwd)/values.yaml:/usr/app/values.yaml ev-simulator:$version /bin/sh
    ;;
  "sample")
    docker run -t -p 8080:8080 -v $(pwd)/values.yaml:/usr/app/values.yaml ev-simulator:$version
    ;;
  "run")
    docker run -it -p 8080:8080 -v $(pwd)/values.yaml:/usr/app/values.yaml ev-simulator:$version
    ;;
  "daemon")
    docker run -t -p 8080:8080 -d -v $(pwd)/values.yaml:/usr/app/values.yaml ev-simulator:$version
    ;;
  *)
    echo "Just building without running."
    echo "Usage: $0 {shell|run|sample}"
    ;;
esac
