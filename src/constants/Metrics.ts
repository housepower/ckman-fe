export const Metrics = Object.freeze([
  {
    title: 'ClickHouse Table KPIs',
    metrics: [{
      expect: "Inserted/second"
    }, {
      expect: "Inserted Rows/second"
    }, {
      expect: "Inserted Bytes/second"
    }, {
      expect: "Queries/second"
    }, {
      expect: "Selected Rows/second"
    }, {
      expect: "Selected Bytes/second"
    }, {
      expect: "Merged"
    }, {
      expect: "Merged Rows/second"
    },{
      expect: "Replicated Part Fetches"
    }, {
      expect: "Replicated Part Merges"
    }, {
      expect: "Total MergeTree Parts"
    }, {
      expect: "Max Parts For Partition"

    }],
  }, {
    title: 'ClickHouse Node KPIs',
    metrics: [{
      expect: "Load Average (15 minutes)"
    }, {
      expect: "CPU Usage (cores)"
    }, {
      expect: "Memory (tracked)"
    }, {
      expect: "Network Recive"
    }, {
      expect: "Network Send"
    }, {
      expect: "IO Wait"
    }, {
      expect: "Read From Disk"
    }, {
      expect: "File Open"
    }, {
      expect: "DiskUsed(default)"
    }],
  }, {
    title: 'ZooKeeper KPIs',
    metrics: [{
      expect: "Zookeeper Create"
    },{
      expect: "Zookeeper Remove"
    },{
      expect: "Zookeeper Wait"
    }, {
      expect: "Zookeeper Session"
    }, {
      expect: "Zookeeper Bytes Received"
    }, {
      expect: "Zookeeper Bytes Sent"
    }],
  },
]);

