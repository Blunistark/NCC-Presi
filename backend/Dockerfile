FROM continuumio/miniconda3

WORKDIR /app
ENV PYTHONUNBUFFERED=1

# Install dlib (main bottleneck) and numpy using conda-forge binaries
RUN conda install -y -c conda-forge dlib numpy cmake && \
    conda clean -afy

# Copy requirements and install remaining Python dependencies directly
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose the port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
