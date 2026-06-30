'use client';
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function ProvenanceGraph({ graph }: { graph: any }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!graph || !graph.nodes || !svgRef.current) return;
    
    // Clear old graph
    d3.select(svgRef.current).selectAll('*').remove();

    const width = 600;
    const height = 400;

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, width, height]);

    const simulation = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink(graph.edges).id((d: any) => d.mbid).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .attr('stroke', '#333')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(graph.edges)
      .join('line')
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .selectAll('g')
      .data(graph.nodes)
      .join('g')
      .call((d3.drag() as any)
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', 15)
      .attr('fill', (d: any) => d.id === graph.mbid ? '#00C2FF' : '#F59E0B') // Track is Cyan, others Amber
      .attr('stroke', '#0A0A0F')
      .attr('stroke-width', 3);

    node.append('text')
      .attr('x', 20)
      .attr('y', '0.31em')
      .text((d: any) => `${d.name} (${d.role})`)
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [graph]);

  return <svg ref={svgRef} className="w-full h-full min-h-[400px]"></svg>;
}
