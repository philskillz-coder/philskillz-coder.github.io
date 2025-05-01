FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .


# Install git and the requirements
RUN apt-get update && apt-get install -y git
RUN pip install --no-cache-dir -r requirements.txt

# Command to run the application using the virtual environment
CMD ["python3.10", "main.py"]