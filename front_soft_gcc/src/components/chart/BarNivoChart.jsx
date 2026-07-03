import React from 'react';
import { ResponsiveBar } from '@nivo/bar';

const BarNivoChart = ({ datas, type, legendBottom, legendLeft}) => {
  const showLegend = type === 1;

  return (
    <div style={{ height: '400px' }}>
      <ResponsiveBar
        data={datas}
        keys={['value']}
        indexBy="label"
        margin={{ top: 80, right: 30, bottom: 70, left: 60 }}
        padding={0.3}
        layout="vertical"
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={({ data }) => data.color}
        borderColor={({ data }) => data.borderColor}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 10,
          tickRotation: -30,
          legend: legendBottom,
          legendPosition: 'middle',
          legendOffset: 50,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          legend: legendLeft,
          legendPosition: 'middle',
          legendOffset: -50,
        }}
        enableLabel={true}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        animate={true}
        motionStiffness={90}
        motionDamping={15}
        theme={{
          tooltip: {
            container: {
              fontSize: '14px',
              background: '#fff',
              color: '#333',
            },
          },
          labels: {
            text: {
              fontSize: 12,
              fontWeight: 'bold',
            },
          },
        }}
        legends={
          showLegend
            ? [
                {
                  dataFrom: 'keys',
                  anchor: 'top',
                  direction: 'row',
                  justify: false,
                  translateY: -50,
                  itemsSpacing: 20,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 0.8,
                      },
                    },
                  ],
                  data: [
                    {
                      id: 'value',
                      label: 'Non validé',
                      color: 'rgba(255, 99, 132, 0.7)',
                    },
                    {
                      id: 'value',
                      label: 'Validé par évaluation',
                      color: 'rgba(255, 206, 86, 0.7)',
                    }
                  ],
                },
              ]
            : []
        }
      />
    </div>
  );
};

export default BarNivoChart;
